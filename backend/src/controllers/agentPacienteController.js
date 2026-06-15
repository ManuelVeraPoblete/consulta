const Anthropic = require('@anthropic-ai/sdk');
const { Op } = require('sequelize');
const {
  User, MedicoPerfil, Especialidad, Paciente, Cita, AtencionMedica, Receta, RecetaItem,
} = require('../models');
const { esFechaDisponible } = require('./agendaController');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 5 });
const MAX_ROUNDS = 5;

const HORAS_CONSULTA = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];

// ---------------------------------------------------------------------------
// Rate limiting: 20 req/user/hour (in-memory)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const reqs = (rateLimitMap.get(userId) || []).filter((t) => now - t < windowMs);
  if (reqs.length >= 20) return false;
  reqs.push(now);
  rateLimitMap.set(userId, reqs);
  return true;
}

// ---------------------------------------------------------------------------
// Prerequisito 2: vincular User con Paciente por RUT
// ---------------------------------------------------------------------------
async function resolverPaciente(rut) {
  if (!rut)
    throw new Error('Tu cuenta no tiene RUT registrado. Contacta a la secretaría para vincular tu ficha.');
  const paciente = await Paciente.findOne({ where: { rut } });
  if (!paciente)
    throw new Error('No se encontró tu ficha de paciente. Contacta a la secretaría.');
  return paciente;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
function buildPacienteSystemPrompt(paciente) {
  const fechaHora = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
  return `Eres un asistente de salud personal del Portal del Paciente de una clínica chilena.
La fecha y hora actual es: ${fechaHora}.

DATOS DEL PACIENTE:
- Nombre: ${paciente.nombre} ${paciente.apellido}
- RUT: ${paciente.rut}
- Previsión: ${paciente.prevision_salud?.toUpperCase()}

PROTOCOLO DE EMERGENCIA (OBLIGATORIO):
Si el paciente menciona síntomas potencialmente graves (dolor en el pecho, dificultad respiratoria, pérdida de consciencia, sangrado activo, convulsiones, etc.), SIEMPRE responde primero con: "Llama al 131 (SAMU) o dirígete a urgencias ahora." — antes de cualquier otra información.

RESTRICCIONES:
- NUNCA emitas diagnósticos médicos. Eres asistente informativo, no médico.
- NUNCA interpretes resultados de exámenes. Derívalo a su médico tratante.
- Solo puedes consultar la información de ESTE paciente. No puedes ver datos de otros.
- No puedes cancelar ni reagendar citas. Para eso, el paciente debe contactar a la secretaría.

CAPACIDADES:
- Ver citas (ver_mis_citas, ver_proxima_cita)
- Ver historial médico y atenciones (ver_historial_medico, ver_detalle_atencion)
- Ver recetas (ver_mis_recetas)
- Ver perfil clínico (ver_mi_perfil_clinico)
- Buscar médicos y verificar disponibilidad (buscar_medicos_disponibles, verificar_disponibilidad_medico)
- Solicitar cita (solicitar_cita — la secretaría confirmará)
- Ver especialidades (ver_especialidades)

Responde siempre en español, de forma empática y clara. Si la pregunta requiere juicio médico, deriva amablemente a su médico tratante.

FORMATO OBLIGATORIO:
- Texto plano únicamente. Prohibido usar markdown.
- Sin asteriscos (*), sin almohadillas (#), sin guiones bajos (_), sin comillas invertidas.
- Para listas usa un guion al inicio de la línea: "- item"
- Separa secciones con una línea en blanco.
- Sé directo y conciso. Solo la información solicitada.
- NUNCA muestres IDs numéricos (id, paciente_id, medico_id, cita_id, etc.). Usa siempre el nombre, descripción o referencia legible para el usuario.`;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const PACIENTE_TOOLS = [
  {
    name: 'ver_mis_citas',
    description: 'Ver las citas del paciente, opcionalmente filtradas por estado.',
    input_schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: ['programada', 'confirmada', 'completada', 'cancelada'],
          description: 'Filtrar por estado (opcional).',
        },
        limite: { type: 'integer', description: 'Máximo de citas a retornar (por defecto 10, máx 20).' },
      },
    },
  },
  {
    name: 'ver_proxima_cita',
    description: 'Ver la próxima cita confirmada o programada del paciente.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'ver_historial_medico',
    description: 'Ver el historial de atenciones médicas del paciente (diagnósticos, tratamientos).',
    input_schema: {
      type: 'object',
      properties: {
        limite: { type: 'integer', description: 'Máximo de atenciones (por defecto 10, máx 20).' },
      },
    },
  },
  {
    name: 'ver_mis_recetas',
    description: 'Ver las recetas médicas emitidas al paciente.',
    input_schema: {
      type: 'object',
      properties: {
        limite: { type: 'integer', description: 'Máximo de recetas (por defecto 5, máx 15).' },
      },
    },
  },
  {
    name: 'ver_mi_perfil_clinico',
    description: 'Ver el perfil clínico: grupo sanguíneo, alergias, antecedentes, previsión.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'buscar_medicos_disponibles',
    description: 'Buscar médicos por especialidad o nombre.',
    input_schema: {
      type: 'object',
      properties: {
        especialidad: { type: 'string', description: 'Nombre de la especialidad.' },
        nombre: { type: 'string', description: 'Nombre parcial del médico.' },
      },
    },
  },
  {
    name: 'verificar_disponibilidad_medico',
    description: 'Verificar disponibilidad de un médico en una fecha y listar slots horarios libres.',
    input_schema: {
      type: 'object',
      properties: {
        medico_id: { type: 'integer', description: 'ID del médico (usuario_id).' },
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD.' },
      },
      required: ['medico_id', 'fecha'],
    },
  },
  {
    name: 'solicitar_cita',
    description: 'Registrar una solicitud de cita. Queda en estado "programada" hasta que la secretaría confirme.',
    input_schema: {
      type: 'object',
      properties: {
        medico_id: { type: 'integer', description: 'ID del médico (usuario_id).' },
        fecha_hora: { type: 'string', description: 'Fecha y hora en ISO 8601 (ej: 2026-06-20T10:00:00).' },
        motivo: { type: 'string', description: 'Motivo de la consulta.' },
      },
      required: ['medico_id', 'fecha_hora'],
    },
  },
  {
    name: 'ver_detalle_atencion',
    description: 'Ver los detalles completos de una atención médica específica del paciente.',
    input_schema: {
      type: 'object',
      properties: {
        atencion_id: { type: 'integer', description: 'ID de la atención médica.' },
      },
      required: ['atencion_id'],
    },
  },
  {
    name: 'ver_especialidades',
    description: 'Listar todas las especialidades médicas disponibles.',
    input_schema: { type: 'object', properties: {} },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------
async function executeToolForPaciente(toolName, input, paciente) {
  const pacienteId = paciente.id;

  switch (toolName) {
    case 'ver_mis_citas': {
      const limite = Math.min(input.limite || 10, 20);
      const where = { paciente_id: pacienteId };
      if (input.estado) where.estado = input.estado;
      const citas = await Cita.findAll({
        where,
        include: [{
          model: User, as: 'medico', attributes: ['nombre', 'apellido'],
          include: [{
            model: MedicoPerfil, as: 'perfil', required: false,
            attributes: ['especialidad_id'],
            include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
          }],
        }],
        order: [['fecha_hora', 'DESC']],
        limit: limite,
      });
      return citas.map((c) => ({
        id: c.id,
        fecha_hora: c.fecha_hora,
        estado: c.estado,
        motivo: c.motivo,
        duracion_min: c.duracion_min,
        medico: c.medico
          ? `Dr. ${c.medico.nombre} ${c.medico.apellido}${c.medico.perfil?.especialidad?.nombre ? ' — ' + c.medico.perfil.especialidad.nombre : ''}`
          : 'N/A',
      }));
    }

    case 'ver_proxima_cita': {
      const cita = await Cita.findOne({
        where: {
          paciente_id: pacienteId,
          fecha_hora: { [Op.gte]: new Date() },
          estado: { [Op.in]: ['programada', 'confirmada'] },
        },
        include: [{
          model: User, as: 'medico', attributes: ['nombre', 'apellido'],
          include: [{
            model: MedicoPerfil, as: 'perfil', required: false,
            attributes: ['especialidad_id', 'direccion_consulta', 'telefono_consulta'],
            include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
          }],
        }],
        order: [['fecha_hora', 'ASC']],
      });
      if (!cita) return { mensaje: 'No tienes citas próximas programadas.' };
      return {
        id: cita.id,
        fecha_hora: cita.fecha_hora,
        estado: cita.estado,
        motivo: cita.motivo,
        medico: cita.medico ? `Dr. ${cita.medico.nombre} ${cita.medico.apellido}` : 'N/A',
        especialidad: cita.medico?.perfil?.especialidad?.nombre || null,
        direccion: cita.medico?.perfil?.direccion_consulta || null,
        telefono_consulta: cita.medico?.perfil?.telefono_consulta || null,
      };
    }

    case 'ver_historial_medico': {
      const limite = Math.min(input.limite || 10, 20);
      const atenciones = await AtencionMedica.findAll({
        where: { paciente_id: pacienteId },
        include: [
          {
            model: User, as: 'medico', attributes: ['nombre', 'apellido'],
            include: [{
              model: MedicoPerfil, as: 'perfil', required: false,
              attributes: ['especialidad_id'],
              include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
            }],
          },
          { model: Cita, as: 'cita', attributes: ['fecha_hora'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: limite,
        attributes: ['id', 'diagnostico', 'cie10', 'plan_tratamiento', 'indicaciones', 'motivo_consulta', 'createdAt'],
      });
      return atenciones.map((a) => ({
        id: a.id,
        fecha: a.cita?.fecha_hora || a.createdAt,
        medico: a.medico ? `Dr. ${a.medico.nombre} ${a.medico.apellido}` : 'N/A',
        especialidad: a.medico?.perfil?.especialidad?.nombre || null,
        diagnostico: a.diagnostico,
        cie10: a.cie10,
        plan_tratamiento: a.plan_tratamiento,
        indicaciones: a.indicaciones,
        motivo_consulta: a.motivo_consulta,
      }));
    }

    case 'ver_mis_recetas': {
      const limite = Math.min(input.limite || 5, 15);
      const recetas = await Receta.findAll({
        where: { paciente_id: pacienteId },
        include: [
          { model: User, as: 'medico', attributes: ['nombre', 'apellido'] },
          { model: RecetaItem, as: 'items' },
        ],
        order: [['createdAt', 'DESC']],
        limit: limite,
      });
      return recetas.map((r) => ({
        id: r.id,
        fecha: r.createdAt,
        medico: r.medico ? `Dr. ${r.medico.nombre} ${r.medico.apellido}` : 'N/A',
        observaciones: r.observaciones,
        items: (r.items || []).map((i) => ({
          medicamento: i.medicamento,
          dosis: i.dosis,
          frecuencia: i.frecuencia,
          duracion: i.duracion,
          indicaciones: i.indicaciones,
        })),
      }));
    }

    case 'ver_mi_perfil_clinico': {
      return {
        nombre: `${paciente.nombre} ${paciente.apellido}`,
        rut: paciente.rut,
        fecha_nacimiento: paciente.fecha_nacimiento,
        genero: paciente.genero,
        grupo_sanguineo: paciente.grupo_sanguineo,
        alergias: paciente.alergias || 'Sin alergias registradas',
        antecedentes: paciente.antecedentes || 'Sin antecedentes registrados',
        prevision_salud: paciente.prevision_salud,
        nombre_isapre: paciente.nombre_isapre || null,
        numero_fonasa: paciente.numero_fonasa || null,
        contacto_emergencia: paciente.contacto_emergencia_nombre
          ? `${paciente.contacto_emergencia_nombre} — ${paciente.contacto_emergencia_telefono || 'sin teléfono'}`
          : null,
      };
    }

    case 'buscar_medicos_disponibles': {
      let especialidadId = null;
      if (input.especialidad) {
        const esp = await Especialidad.findOne({
          where: { nombre: { [Op.like]: `%${input.especialidad}%` }, activo: true },
          attributes: ['id'],
        });
        if (!esp) return { resultados: [], mensaje: `No se encontró especialidad: ${input.especialidad}` };
        especialidadId = esp.id;
      }

      const perfilWhere = {};
      if (especialidadId) perfilWhere.especialidad_id = especialidadId;

      const usuarioWhere = { activo: true };
      if (input.nombre) {
        usuarioWhere[Op.or] = [
          { nombre:   { [Op.like]: `%${input.nombre}%` } },
          { apellido: { [Op.like]: `%${input.nombre}%` } },
        ];
      }

      const medicos = await MedicoPerfil.findAll({
        where: perfilWhere,
        include: [
          { model: User, as: 'usuario', attributes: ['id', 'nombre', 'apellido'], where: usuarioWhere },
          { model: Especialidad, as: 'especialidad', required: false, attributes: ['nombre'] },
        ],
        limit: 10,
        order: [[{ model: User, as: 'usuario' }, 'apellido', 'ASC']],
        attributes: ['usuario_id', 'acepta_fonasa', 'acepta_isapre', 'acepta_particular', 'valor_particular'],
      });

      return medicos.map((m) => ({
        medico_id: m.usuario_id,
        nombre: `Dr. ${m.usuario.nombre} ${m.usuario.apellido}`,
        especialidad: m.especialidad?.nombre || null,
        acepta_fonasa: m.acepta_fonasa,
        acepta_isapre: m.acepta_isapre,
        acepta_particular: m.acepta_particular,
        valor_particular: m.valor_particular,
      }));
    }

    case 'verificar_disponibilidad_medico': {
      const { medico_id, fecha } = input;
      const disponible = await esFechaDisponible(Number(medico_id), fecha);
      if (!disponible) return { disponible: false, slots: [], mensaje: 'El médico no tiene disponibilidad ese día.' };

      const diaInicio = new Date(`${fecha}T00:00:00`);
      const diaFin    = new Date(`${fecha}T23:59:59`);
      const citas = await Cita.findAll({
        where: {
          medico_id: Number(medico_id),
          fecha_hora: { [Op.between]: [diaInicio, diaFin] },
          estado: { [Op.ne]: 'cancelada' },
        },
        attributes: ['fecha_hora', 'duracion_min'],
      });

      const ocupados = citas.map((c) => ({
        inicio: new Date(c.fecha_hora).getTime(),
        fin:    new Date(c.fecha_hora).getTime() + c.duracion_min * 60000,
      }));

      const slots = HORAS_CONSULTA.map((hora) => {
        const slotInicio = new Date(`${fecha}T${hora}:00`).getTime();
        const slotFin    = slotInicio + 30 * 60000;
        const libre      = !ocupados.some((o) => o.inicio < slotFin && o.fin > slotInicio);
        return { hora, libre };
      });

      return { disponible: true, slots };
    }

    case 'solicitar_cita': {
      const { medico_id, fecha_hora, motivo } = input;
      const medicoExiste = await User.findOne({
        where: { id: medico_id, activo: true },
        attributes: ['id', 'nombre', 'apellido'],
      });
      if (!medicoExiste) return { error: 'Médico no encontrado' };

      if (new Date(fecha_hora) <= new Date())
        return { error: 'La fecha y hora solicitada debe ser futura.' };

      const cita = await Cita.create({
        paciente_id:   pacienteId,
        medico_id,
        secretaria_id: null,
        fecha_hora,
        duracion_min:  30,
        motivo:        motivo || null,
        estado:        'programada',
      });

      return {
        mensaje: 'Solicitud de cita registrada exitosamente. La secretaría confirmará tu hora en breve.',
        cita_id: cita.id,
        medico: `Dr. ${medicoExiste.nombre} ${medicoExiste.apellido}`,
        fecha_hora,
        estado: 'programada',
      };
    }

    case 'ver_detalle_atencion': {
      // IDOR guard: WHERE id = atencion_id AND paciente_id = pacienteId
      const atencion = await AtencionMedica.findOne({
        where: { id: input.atencion_id, paciente_id: pacienteId },
        include: [
          {
            model: User, as: 'medico', attributes: ['nombre', 'apellido'],
            include: [{
              model: MedicoPerfil, as: 'perfil', required: false,
              attributes: ['especialidad_id', 'numero_registro', 'titulo_profesional'],
              include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
            }],
          },
          { model: Cita, as: 'cita', attributes: ['fecha_hora', 'motivo'] },
          {
            model: Receta, as: 'receta', required: false,
            include: [{ model: RecetaItem, as: 'items' }],
          },
        ],
      });
      if (!atencion) return { error: 'Atención no encontrada.' };
      return {
        id: atencion.id,
        fecha: atencion.cita?.fecha_hora || atencion.createdAt,
        medico: atencion.medico ? `Dr. ${atencion.medico.nombre} ${atencion.medico.apellido}` : 'N/A',
        especialidad: atencion.medico?.perfil?.especialidad?.nombre || null,
        numero_registro: atencion.medico?.perfil?.numero_registro || null,
        motivo_cita: atencion.cita?.motivo || null,
        motivo_consulta: atencion.motivo_consulta,
        anamnesis: atencion.anamnesis,
        examen_fisico: atencion.examen_fisico,
        diagnostico: atencion.diagnostico,
        cie10: atencion.cie10,
        plan_tratamiento: atencion.plan_tratamiento,
        indicaciones: atencion.indicaciones,
        signos_vitales: {
          presion: atencion.presion_sistolica
            ? `${atencion.presion_sistolica}/${atencion.presion_diastolica} mmHg` : null,
          frecuencia_cardiaca: atencion.frecuencia_cardiaca
            ? `${atencion.frecuencia_cardiaca} bpm` : null,
          temperatura: atencion.temperatura ? `${atencion.temperatura} °C` : null,
          peso:        atencion.peso        ? `${atencion.peso} kg`       : null,
          saturacion:  atencion.saturacion_oxigeno ? `${atencion.saturacion_oxigeno}%` : null,
        },
        receta: atencion.receta ? {
          id:            atencion.receta.id,
          observaciones: atencion.receta.observaciones,
          items: (atencion.receta.items || []).map((i) => ({
            medicamento: i.medicamento,
            dosis:       i.dosis,
            frecuencia:  i.frecuencia,
            duracion:    i.duracion,
            indicaciones: i.indicaciones,
          })),
        } : null,
      };
    }

    case 'ver_especialidades': {
      const especialidades = await Especialidad.findAll({
        where: { activo: true },
        order: [['nombre', 'ASC']],
        attributes: ['id', 'nombre'],
      });
      return especialidades.map((e) => ({ id: e.id, nombre: e.nombre }));
    }

    default:
      return { error: `Herramienta desconocida: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Agent handler
// ---------------------------------------------------------------------------
const agentPaciente = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ message: 'messages debe ser un array no vacío' });

    if (messages.length > 50)
      return res.status(400).json({ message: 'Máximo 50 mensajes por sesión' });

    if (messages.some(m => typeof m?.content !== 'string' || m.content.length > 4000))
      return res.status(400).json({ message: 'Mensaje demasiado largo (máximo 4000 caracteres)' });

    if (!checkRateLimit(req.user.id))
      return res.status(429).json({ message: 'Has realizado demasiadas consultas. Espera unos minutos antes de continuar.' });

    // Prerequisito 2: vincular User con Paciente por RUT
    let paciente;
    try {
      paciente = await resolverPaciente(req.user.rut);
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }

    const systemPrompt = buildPacienteSystemPrompt(paciente);
    const currentMessages = messages.map(({ role, content }) => ({ role, content }));
    let rounds = 0;

    while (rounds < MAX_ROUNDS) {
      rounds++;
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        tools: PACIENTE_TOOLS,
        messages: currentMessages,
      });

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find((b) => b.type === 'text');
        return res.json({ reply: textBlock?.text || 'Sin respuesta.' });
      }

      if (response.stop_reason === 'tool_use') {
        currentMessages.push({ role: 'assistant', content: response.content });

        const toolResults = [];
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;
          let result;
          try {
            result = await executeToolForPaciente(block.name, block.input, paciente);
          } catch (err) {
            result = { error: err.message };
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
        currentMessages.push({ role: 'user', content: toolResults });
        continue;
      }

      break;
    }

    const lastMsg = currentMessages[currentMessages.length - 1];
    if (lastMsg?.role === 'assistant') {
      const textBlock = Array.isArray(lastMsg.content)
        ? lastMsg.content.find((b) => b.type === 'text')
        : null;
      return res.json({ reply: textBlock?.text || 'Procesando. Por favor, intenta de nuevo.' });
    }

    return res.json({ reply: 'No se pudo generar una respuesta. Por favor, intenta de nuevo.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Error interno del asistente.' });
  }
};

module.exports = { agentPaciente };
