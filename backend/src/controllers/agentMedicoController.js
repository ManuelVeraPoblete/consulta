'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const {
  User,
  MedicoPerfil,
  Especialidad,
  Paciente,
  Cita,
  AtencionMedica,
  Receta,
  RecetaItem,
  Medicamento,
} = require('../models');
const { Op } = require('sequelize');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 5 });

// ---------------------------------------------------------------------------
// Borrador en memoria (MVP) — no persiste entre reinicios del proceso
// ---------------------------------------------------------------------------
const borradores = new Map(); // key: `${medicoId}-${citaId}`, value: objeto borrador

// ---------------------------------------------------------------------------
// INCLUDE reutilizable para AtencionMedica
// ---------------------------------------------------------------------------
const INCLUDE_ATENCION = [
  {
    model: Paciente,
    as: 'paciente',
    attributes: [
      'id', 'nombre', 'apellido', 'rut', 'fecha_nacimiento', 'genero',
      'grupo_sanguineo', 'alergias', 'antecedentes', 'prevision_salud', 'nombre_isapre',
    ],
  },
  {
    model: User,
    as: 'medico',
    attributes: ['id', 'nombre', 'apellido'],
    include: [
      {
        model: MedicoPerfil,
        as: 'perfil',
        required: false,
        include: [
          { model: Especialidad, as: 'especialidad', attributes: ['nombre'] },
        ],
      },
    ],
  },
  {
    model: Cita,
    as: 'cita',
    attributes: ['id', 'fecha_hora', 'duracion_min', 'motivo', 'estado'],
  },
  {
    model: Receta,
    as: 'receta',
    required: false,
    include: [{ model: RecetaItem, as: 'items' }],
  },
];

// ---------------------------------------------------------------------------
// System prompt del médico
// ---------------------------------------------------------------------------
function buildMedicoSystemPrompt(medicoData) {
  const especialidad = medicoData?.perfil?.especialidad?.nombre || 'Sin especialidad registrada';
  const numRegistro  = medicoData?.perfil?.numero_registro || 'No registrado';
  return `Eres un asistente clínico de IA para el Dr./Dra. ${medicoData.nombre} ${medicoData.apellido}, especialidad: ${especialidad}, número de registro: ${numRegistro}.
Sistema bajo legislación chilena: Ley 20.584 y normativa MINSAL.

ROL Y LÍMITES:
- Eres un APOYO CLÍNICO, no un diagnosticador autónomo.
- NUNCA emitas un diagnóstico definitivo. Sugiere diagnósticos diferenciales y códigos CIE-10 para que el médico los evalúe.
- NUNCA prescribas medicamentos. Informa sobre dosis habituales e interacciones.
- Cuando exista alerta de ALERGIA o INTERACCIÓN GRAVE, comunicarla PRIMERO con el formato: [ALERTA CRÍTICA - ALERGIA] o [ALERTA CRÍTICA - INTERACCIÓN GRAVE]

PROTOCOLOS DE ALERTA:
1. ALERGIA: Si alergias del paciente contiene referencia a familia farmacológica del medicamento propuesto → ALERTA CRÍTICA inmediata.
2. INTERACCIÓN GRAVE: Warfarina+AINEs, Litio+diuréticos, IMAOs+simpaticomiméticos.
3. VALORES CRÍTICOS: PA sistólica >180 o <90 mmHg, FC >120 o <50 lpm, SpO2 <90%, Temperatura >39.5°C → reportar inmediatamente.

PRIVACIDAD (Ley 20.584 art. 12):
- Toda información clínica es confidencial.
- La responsabilidad clínica del diagnóstico y prescripción recae únicamente en el médico titulado.

PROTOCOLO DE BÚSQUEDA:
- Cuando el usuario mencione un paciente por nombre, apellido o RUT, usa search_patient ANTES de cualquier tool que requiera paciente_id.
- Nunca inventes IDs ni los pidas al usuario. Resuélvelos siempre con search_patient.

FORMATO OBLIGATORIO:
- Texto plano únicamente. Prohibido usar markdown.
- Sin asteriscos (*), sin almohadillas (#), sin guiones bajos (_), sin comillas invertidas.
- Para listas usa un guion al inicio de la línea: "- item"
- Separa secciones con una línea en blanco.
- Sé directo y conciso. Solo la información solicitada.
- NUNCA muestres IDs numéricos (id, paciente_id, medico_id, cita_id, etc.). Usa siempre el nombre, descripción o referencia legible para el usuario.`;
}

// ---------------------------------------------------------------------------
// Definiciones de las 12 herramientas
// ---------------------------------------------------------------------------
const MEDICO_TOOLS = [
  {
    name: 'search_patient',
    description: 'Busca pacientes por nombre, apellido o RUT. Úsala SIEMPRE antes de cualquier tool que requiera paciente_id. Solo devuelve pacientes que han tenido cita con este médico.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nombre, apellido o RUT (mínimo 2 caracteres)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_patient_data',
    description: 'Datos clínicos del paciente: antecedentes, alergias, grupo sanguíneo, previsión, contacto de emergencia.',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id: { type: 'integer' },
      },
      required: ['paciente_id'],
    },
  },
  {
    name: 'get_historial_clinico',
    description: 'Historial de atenciones médicas del paciente. Incluye diagnósticos, signos vitales, plan de tratamiento y recetas.',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id:      { type: 'integer' },
        limit:            { type: 'integer', default: 5 },
        solo_este_medico: { type: 'boolean', default: false },
      },
      required: ['paciente_id'],
    },
  },
  {
    name: 'get_signos_vitales_serie',
    description: 'Serie temporal de signos vitales del paciente para detectar tendencias (PA, FC, peso, temperatura, SpO2).',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id: { type: 'integer' },
        limit:       { type: 'integer', default: 10 },
      },
      required: ['paciente_id'],
    },
  },
  {
    name: 'check_alergias',
    description: 'Verifica las alergias documentadas del paciente frente a un medicamento propuesto. Claude analiza semánticamente la coincidencia.',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id:           { type: 'integer' },
        medicamento_propuesto: { type: 'string' },
      },
      required: ['paciente_id', 'medicamento_propuesto'],
    },
  },
  {
    name: 'get_medicamentos_activos',
    description: 'Medicación activa del paciente en los últimos N días (default 90). Útil para detectar interacciones antes de prescribir.',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id:   { type: 'integer' },
        dias_vigencia: { type: 'integer', default: 90 },
      },
      required: ['paciente_id'],
    },
  },
  {
    name: 'verificar_interacciones_medicamentosas',
    description: 'Analiza interacciones entre medicamento nuevo y medicamentos actuales usando conocimiento farmacológico del modelo.',
    input_schema: {
      type: 'object',
      properties: {
        medicamento_nuevo:     { type: 'string' },
        medicamentos_actuales: { type: 'array', items: { type: 'string' } },
      },
      required: ['medicamento_nuevo', 'medicamentos_actuales'],
    },
  },
  {
    name: 'buscar_cie10',
    description: 'Sugiere códigos CIE-10 a partir de una descripción clínica en lenguaje natural.',
    input_schema: {
      type: 'object',
      properties: {
        termino: { type: 'string', description: 'Descripción clínica, ej: "faringitis estreptocócica"' },
      },
      required: ['termino'],
    },
  },
  {
    name: 'guardar_borrador_atencion',
    description: 'Guarda estado parcial de la consulta en memoria (no persiste entre reinicios). La cita NO se marca como completada.',
    input_schema: {
      type: 'object',
      properties: {
        cita_id:             { type: 'integer' },
        paciente_id:         { type: 'integer' },
        motivo_consulta:     { type: 'string' },
        anamnesis:           { type: 'string' },
        examen_fisico:       { type: 'string' },
        diagnostico:         { type: 'string' },
        cie10:               { type: 'string' },
        plan_tratamiento:    { type: 'string' },
        indicaciones:        { type: 'string' },
        presion_sistolica:   { type: 'integer' },
        presion_diastolica:  { type: 'integer' },
        frecuencia_cardiaca: { type: 'integer' },
        temperatura:         { type: 'number' },
        peso:                { type: 'number' },
        talla:               { type: 'number' },
        saturacion_oxigeno:  { type: 'integer' },
      },
      required: ['cita_id'],
    },
  },
  {
    name: 'get_agenda_del_dia',
    description: 'Agenda de citas del médico para el día de hoy u otra fecha.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'YYYY-MM-DD (default hoy)' },
      },
    },
  },
  {
    name: 'get_resumen_consultas_anteriores',
    description: 'Obtiene historial clínico y pide al modelo que lo sintetice en formato SOAP simplificado.',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id: { type: 'integer' },
        limit:       { type: 'integer', default: 5 },
      },
      required: ['paciente_id'],
    },
  },
  {
    name: 'buscar_medicamento_registro',
    description: 'Busca medicamentos con registro ISP en el catálogo del sistema.',
    input_schema: {
      type: 'object',
      properties: {
        termino: { type: 'string' },
        limit:   { type: 'integer', default: 10 },
      },
      required: ['termino'],
    },
  },
  {
    name: 'get_casos_similares',
    description: 'Busca casos con diagnóstico similar en el historial de atenciones del propio médico.',
    input_schema: {
      type: 'object',
      properties: {
        cie10_prefix:        { type: 'string', description: 'Ej: "I10" para HTA, "J06" para IRA' },
        termino_diagnostico: { type: 'string', description: 'Texto libre a buscar en campo diagnostico' },
        limit:               { type: 'integer', default: 5 },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Ejecución de herramientas
// ---------------------------------------------------------------------------
async function executeToolForMedico(toolName, input, medicoId) {
  switch (toolName) {
    // -----------------------------------------------------------------------
    case 'search_patient': {
      const { query } = input;
      if (!query || query.trim().length < 2)
        return { error: 'Se requieren al menos 2 caracteres para buscar' };

      const citasDelMedico = await Cita.findAll({
        where: { medico_id: medicoId },
        attributes: ['paciente_id'],
        group: ['paciente_id'],
        raw: true,
      });
      const pacienteIds = citasDelMedico.map((c) => c.paciente_id);
      if (!pacienteIds.length)
        return { pacientes: [], total: 0, mensaje: 'Este médico no tiene pacientes registrados aún.' };

      const q = query.trim();
      const pacientes = await Paciente.findAll({
        where: {
          id: { [Op.in]: pacienteIds },
          [Op.or]: [
            { nombre:   { [Op.like]: `%${q}%` } },
            { apellido: { [Op.like]: `%${q}%` } },
            { rut:      { [Op.like]: `%${q}%` } },
          ],
        },
        attributes: ['id', 'nombre', 'apellido', 'rut', 'fecha_nacimiento', 'prevision_salud', 'alergias'],
        order: [['apellido', 'ASC'], ['nombre', 'ASC']],
        limit: 10,
      });
      return { pacientes, total: pacientes.length };
    }

    // -----------------------------------------------------------------------
    case 'get_patient_data': {
      const { paciente_id } = input;
      const paciente = await Paciente.findByPk(paciente_id, {
        attributes: [
          'id', 'nombre', 'apellido', 'rut', 'fecha_nacimiento', 'genero',
          'grupo_sanguineo', 'prevision_salud', 'nombre_isapre', 'numero_fonasa',
          'alergias', 'antecedentes', 'telefono',
          'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
        ],
      });
      if (!paciente) return { error: 'Paciente no encontrado' };
      const hoy  = new Date();
      const nac  = new Date(paciente.fecha_nacimiento);
      const edad = hoy.getFullYear() - nac.getFullYear() -
        (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate()) ? 1 : 0);
      return { ...paciente.toJSON(), edad };
    }

    // -----------------------------------------------------------------------
    case 'get_historial_clinico': {
      const { paciente_id, limit = 5, solo_este_medico = false } = input;
      const where = { paciente_id };
      if (solo_este_medico) where.medico_id = medicoId;

      const atenciones = await AtencionMedica.findAll({
        where,
        include: INCLUDE_ATENCION,
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 20),
      });
      return { total: atenciones.length, atenciones };
    }

    // -----------------------------------------------------------------------
    case 'get_signos_vitales_serie': {
      const { paciente_id, limit = 10 } = input;
      const serie = await AtencionMedica.findAll({
        where: {
          paciente_id,
          [Op.or]: [
            { presion_sistolica:   { [Op.ne]: null } },
            { presion_diastolica:  { [Op.ne]: null } },
            { frecuencia_cardiaca: { [Op.ne]: null } },
            { temperatura:         { [Op.ne]: null } },
            { peso:                { [Op.ne]: null } },
            { saturacion_oxigeno:  { [Op.ne]: null } },
          ],
        },
        attributes: [
          'id', 'createdAt', 'presion_sistolica', 'presion_diastolica',
          'frecuencia_cardiaca', 'temperatura', 'peso', 'talla', 'saturacion_oxigeno',
        ],
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 20),
        raw: true,
      });
      return { total: serie.length, serie: serie.reverse() }; // orden cronológico
    }

    // -----------------------------------------------------------------------
    case 'check_alergias': {
      const { paciente_id, medicamento_propuesto } = input;
      const paciente = await Paciente.findByPk(paciente_id, {
        attributes: ['nombre', 'apellido', 'alergias', 'antecedentes'],
      });
      if (!paciente) return { error: 'Paciente no encontrado' };
      return {
        paciente: `${paciente.nombre} ${paciente.apellido}`,
        alergias_documentadas: paciente.alergias || 'Sin alergias documentadas',
        antecedentes:          paciente.antecedentes || 'Sin antecedentes',
        medicamento_propuesto,
        instruccion: 'Analiza si el medicamento propuesto o su familia farmacológica aparece en las alergias documentadas. Indica nivel: critica/advertencia/ninguna.',
      };
    }

    // -----------------------------------------------------------------------
    case 'get_medicamentos_activos': {
      const { paciente_id, dias_vigencia = 90 } = input;
      const fechaCorte = new Date();
      fechaCorte.setDate(fechaCorte.getDate() - dias_vigencia);

      const recetas = await Receta.findAll({
        where: {
          paciente_id,
          createdAt: { [Op.gte]: fechaCorte },
        },
        include: [{ model: RecetaItem, as: 'items' }],
        order: [['createdAt', 'DESC']],
      });

      const medicamentos = recetas.flatMap(r =>
        r.items.map(i => ({
          medicamento:  i.medicamento,
          dosis:        i.dosis,
          frecuencia:   i.frecuencia,
          duracion:     i.duracion,
          receta_fecha: r.createdAt,
        }))
      );

      return { total_recetas: recetas.length, medicamentos_activos: medicamentos, dias_vigencia };
    }

    // -----------------------------------------------------------------------
    case 'verificar_interacciones_medicamentosas': {
      const { medicamento_nuevo, medicamentos_actuales } = input;
      return {
        medicamento_nuevo,
        medicamentos_actuales,
        instruccion: 'Analiza interacciones farmacológicas conocidas entre el medicamento nuevo y cada uno de los medicamentos actuales. Para cada par, indica: severidad (grave/moderada/leve/ninguna), mecanismo y recomendación clínica.',
      };
    }

    // -----------------------------------------------------------------------
    case 'buscar_cie10': {
      const { termino } = input;
      return {
        termino,
        instruccion: 'Proporciona los 3-5 códigos CIE-10 más apropiados para esta descripción clínica, ordenados de más a menos específico. Formato: [{ codigo, descripcion, nota_clinica }]',
      };
    }

    // -----------------------------------------------------------------------
    case 'guardar_borrador_atencion': {
      const { cita_id, ...campos } = input;
      const key     = `${medicoId}-${cita_id}`;
      const borrador = {
        ...campos,
        cita_id,
        medico_id:   medicoId,
        guardado_en: new Date().toISOString(),
      };
      borradores.set(key, borrador);
      let imc = null;
      if (campos.peso && campos.talla) {
        const tallam = campos.talla / 100;
        imc = (campos.peso / (tallam * tallam)).toFixed(1);
      }
      return {
        borrador_guardado:  true,
        cita_id,
        campos_guardados:   Object.keys(campos).filter(k => campos[k] !== undefined),
        imc:                imc ? parseFloat(imc) : null,
        nota: 'Borrador en memoria. Cita sigue en estado actual. Para finalizar la atención, usa el formulario de atención médica.',
      };
    }

    // -----------------------------------------------------------------------
    case 'get_agenda_del_dia': {
      const fecha     = input.fecha || new Date().toISOString().split('T')[0];
      const inicioDia = new Date(`${fecha}T00:00:00`);
      const finDia    = new Date(`${fecha}T23:59:59`);

      const citas = await Cita.findAll({
        where: {
          medico_id: medicoId,
          fecha_hora: { [Op.between]: [inicioDia, finDia] },
          estado:     { [Op.ne]: 'cancelada' },
        },
        include: [
          {
            model: Paciente,
            as:    'paciente',
            attributes: ['id', 'nombre', 'apellido', 'rut', 'prevision_salud'],
          },
        ],
        order: [['fecha_hora', 'ASC']],
      });

      const resumen = { completadas: 0, en_progreso: 0, pendientes: 0 };
      for (const c of citas) {
        if (c.estado === 'completada') resumen.completadas++;
        else resumen.pendientes++;
      }

      return { fecha, total: citas.length, resumen, citas };
    }

    // -----------------------------------------------------------------------
    case 'get_resumen_consultas_anteriores': {
      const { paciente_id, limit = 5 } = input;
      const atenciones = await AtencionMedica.findAll({
        where: { paciente_id },
        attributes: [
          'id', 'createdAt', 'motivo_consulta', 'diagnostico', 'cie10',
          'plan_tratamiento', 'indicaciones',
        ],
        include: [
          { model: User, as: 'medico', attributes: ['nombre', 'apellido'] },
          {
            model:    Receta,
            as:       'receta',
            required: false,
            include:  [
              {
                model:      RecetaItem,
                as:         'items',
                attributes: ['medicamento', 'dosis', 'frecuencia', 'duracion'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 10),
      });
      return {
        total:     atenciones.length,
        atenciones,
        instruccion: 'Sintetiza estas atenciones en un resumen clínico tipo SOAP simplificado, destacando diagnósticos recurrentes, medicación crónica y evolución del paciente.',
      };
    }

    // -----------------------------------------------------------------------
    case 'buscar_medicamento_registro': {
      const { termino, limit = 10 } = input;
      if (!termino || termino.length < 2) return { error: 'El término debe tener al menos 2 caracteres' };
      const medicamentos = await Medicamento.findAll({
        where: {
          activo: true,
          nombre: { [Op.like]: `%${termino}%` },
        },
        attributes: ['id', 'numero_registro', 'nombre'],
        order: [['nombre', 'ASC']],
        limit: Math.min(limit, 30),
      });
      return { medicamentos, total: medicamentos.length };
    }

    // -----------------------------------------------------------------------
    case 'get_casos_similares': {
      const { cie10_prefix, termino_diagnostico, limit = 5 } = input;
      if (!cie10_prefix && !termino_diagnostico) {
        return { error: 'Se requiere cie10_prefix o termino_diagnostico' };
      }

      const orClauses = [];
      if (cie10_prefix)        orClauses.push({ cie10:       { [Op.like]: `${cie10_prefix}%` } });
      if (termino_diagnostico) orClauses.push({ diagnostico: { [Op.like]: `%${termino_diagnostico}%` } });

      const atenciones = await AtencionMedica.findAll({
        where: {
          medico_id: medicoId, // GUARD: solo del propio médico
          [Op.or]: orClauses,
        },
        attributes: ['id', 'createdAt', 'diagnostico', 'cie10', 'plan_tratamiento', 'indicaciones'],
        include: [
          {
            model:    Receta,
            as:       'receta',
            required: false,
            include:  [
              {
                model:      RecetaItem,
                as:         'items',
                attributes: ['medicamento', 'dosis', 'frecuencia'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, 10),
      });
      return { total: atenciones.length, casos: atenciones };
    }

    // -----------------------------------------------------------------------
    default:
      return { error: `Herramienta desconocida: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Handler principal — loop agéntico
// ---------------------------------------------------------------------------
const agentMedico = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Se requiere el array messages' });
    }
    if (messages.length > 50) {
      return res.status(400).json({ message: 'Demasiados mensajes (máximo 50)' });
    }
    if (messages.some(m => typeof m?.content !== 'string' || m.content.length > 4000)) {
      return res.status(400).json({ message: 'Mensaje demasiado largo (máximo 4000 caracteres)' });
    }

    const medicoId = req.user.id; // SIEMPRE del JWT — nunca del body

    // Obtener datos del médico para el system prompt
    const medicoData = await User.findByPk(medicoId, {
      attributes: ['id', 'nombre', 'apellido'],
      include: [
        {
          model:    MedicoPerfil,
          as:       'perfil',
          required: false,
          include:  [
            { model: Especialidad, as: 'especialidad', attributes: ['nombre'] },
          ],
        },
      ],
    });

    const systemPrompt = buildMedicoSystemPrompt(medicoData);

    const MAX_ROUNDS     = 10;
    let currentMessages  = [...messages];
    let rounds           = 0;

    while (rounds < MAX_ROUNDS) {
      rounds++;

      const response = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system:     systemPrompt,
        tools:      MEDICO_TOOLS,
        messages:   currentMessages,
      });

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find(b => b.type === 'text');
        return res.json({ reply: textBlock?.text || '' });
      }

      if (response.stop_reason === 'tool_use') {
        currentMessages.push({ role: 'assistant', content: response.content });

        const toolResults = [];
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;
          let result;
          try {
            result = await executeToolForMedico(block.name, block.input, medicoId);
          } catch (err) {
            result = { error: err.message };
          }
          toolResults.push({
            type:        'tool_result',
            tool_use_id: block.id,
            content:     JSON.stringify(result),
          });
        }

        currentMessages.push({ role: 'user', content: toolResults });
        continue;
      }

      // stop_reason desconocido — salir del loop
      break;
    }

    return res.status(500).json({ message: 'El agente no pudo completar la respuesta' });
  } catch (error) {
    console.error('agentMedico error:', error);
    return res.status(500).json({ message: 'Error interno del agente' });
  }
};

module.exports = { agentMedico };
