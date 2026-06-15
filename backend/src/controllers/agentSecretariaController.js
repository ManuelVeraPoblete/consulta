// backend/src/controllers/agentSecretariaController.js

const Anthropic = require('@anthropic-ai/sdk');
const {
  User,
  MedicoPerfil,
  Especialidad,
  SecretariaMedico,
  Paciente,
  Cita,
  AgendaBloqueo,
} = require('../models');
const { Op } = require('sequelize');
const { esFechaDisponible } = require('./agendaController');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 5 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function verifySecretaryAccess(secretariaId) {
  const asignaciones = await SecretariaMedico.findAll({
    where: { secretaria_id: secretariaId },
  });
  return asignaciones.map((a) => a.medico_id);
}

async function getMedicosInfo(medicoIds) {
  if (!medicoIds.length) return [];
  return User.findAll({
    where: { id: { [Op.in]: medicoIds } },
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
  });
}

function buildSystemPrompt(medicosInfo) {
  const fechaHora = new Date().toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
  });
  const medicosList = medicosInfo
    .map(
      (m) =>
        `- ${m.nombre} ${m.apellido} (medico_id: ${m.id}) — ${m.perfil?.especialidad?.nombre || 'Sin especialidad'}`
    )
    .join('\n');

  return `Eres un asistente de gestión para secretaria médica del sistema de consulta.
La fecha y hora actual es: ${fechaHora}.

MÉDICOS QUE GESTIONAS (solo puedes operar sobre estos):
${medicosList || '(sin médicos asignados)'}

RESTRICCIONES DE ACCESO:
- Solo puedes consultar, crear, modificar o cancelar citas de los médicos listados.
- Nunca inventes paciente_id, medico_id ni cita_id. Verifica con search_patient primero.
- Si el medico_id solicitado no está en tu lista, rechaza la operación.

PROTOCOLO DE CONFIRMACIÓN PARA ACCIONES DESTRUCTIVAS:
- Antes de cancel_appointment: siempre presenta resumen y pide confirmación explícita.
- Antes de reagendar cita con estado 'confirmada': presenta datos y pide confirmación.
- Antes de bulk_confirm_appointments: muestra cuántas citas y pide confirmación.
- Una acción destructiva ejecutada no se puede deshacer desde este sistema.

FORMATO OBLIGATORIO:
- Texto plano únicamente. Prohibido usar markdown.
- Sin asteriscos (*), sin almohadillas (#), sin guiones bajos (_), sin comillas invertidas.
- Para listas usa un guion al inicio de la línea: "- item"
- Separa secciones con una línea en blanco.
- Sé directo y conciso. Solo la información solicitada.
- NUNCA muestres IDs numéricos (id, paciente_id, medico_id, cita_id, etc.). Usa siempre el nombre, descripción o referencia legible para el usuario.

PROTOCOLO DE AGENDAMIENTO:
1. Identifica paciente con search_patient (nombre, apellido o RUT).
2. Si hay más de un resultado, pregunta cuál es el correcto.
3. Verifica disponibilidad con get_doctor_availability para fecha y médico.
4. Si slot no disponible, propón los 3 slots más cercanos disponibles.
5. Confirma datos antes de llamar create_appointment.

LIMITACIONES:
- No puedes crear ni modificar AgendaBloqueos (potestad del médico).
- No puedes acceder a datos clínicos (diagnósticos, recetas, medicamentos).
- No puedes registrar AtencionMedica (potestad del médico).`;
}

async function detectarConflicto(
  medicoId,
  fechaHora,
  duracionMin = 30,
  excludeCitaId = null
) {
  const inicio = new Date(fechaHora);
  const fin = new Date(inicio.getTime() + duracionMin * 60000);

  const inicioDia = new Date(inicio);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(inicio);
  finDia.setHours(23, 59, 59, 999);

  const citasDelDia = await Cita.findAll({
    where: {
      medico_id: medicoId,
      fecha_hora: { [Op.between]: [inicioDia, finDia] },
      estado: { [Op.in]: ['programada', 'confirmada'] },
      ...(excludeCitaId ? { id: { [Op.ne]: excludeCitaId } } : {}),
    },
    attributes: ['id', 'fecha_hora', 'duracion_min'],
  });

  for (const c of citasDelDia) {
    const cInicio = new Date(c.fecha_hora);
    const cFin = new Date(cInicio.getTime() + (c.duracion_min || 30) * 60000);
    if (inicio < cFin && fin > cInicio) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Include helpers
// ---------------------------------------------------------------------------

const INCLUDE_CITA = [
  {
    model: Paciente,
    as: 'paciente',
    attributes: [
      'id',
      'nombre',
      'apellido',
      'rut',
      'telefono',
      'email',
      'prevision_salud',
      'nombre_isapre',
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
];

// ---------------------------------------------------------------------------
// Tools definition
// ---------------------------------------------------------------------------

const SECRETARY_TOOLS = [
  {
    name: 'search_patient',
    description: 'Busca pacientes activos por nombre, apellido o RUT.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        apellido: { type: 'string' },
        rut: {
          type: 'string',
          description: 'RUT con o sin puntos/guión',
        },
      },
    },
  },
  {
    name: 'get_doctor_availability',
    description:
      'Obtiene disponibilidad de un médico para una fecha: slots libres y citas existentes.',
    input_schema: {
      type: 'object',
      properties: {
        medico_id: { type: 'integer' },
        fecha: { type: 'string', description: 'YYYY-MM-DD' },
        duracion_min: { type: 'integer', default: 30 },
        hora_inicio_jornada: { type: 'string', default: '08:00' },
        hora_fin_jornada: { type: 'string', default: '18:00' },
      },
      required: ['medico_id', 'fecha'],
    },
  },
  {
    name: 'create_appointment',
    description:
      'Crea una nueva cita. Verifica disponibilidad y solapamientos antes de crear.',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id: { type: 'integer' },
        medico_id: { type: 'integer' },
        fecha_hora: { type: 'string', description: 'ISO 8601 datetime' },
        duracion_min: { type: 'integer', default: 30 },
        motivo: { type: 'string' },
      },
      required: ['paciente_id', 'medico_id', 'fecha_hora'],
    },
  },
  {
    name: 'update_appointment_status',
    description:
      'Cambia el estado de una cita (programada/confirmada/cancelada). Para cancelar requiere confirmed: true.',
    input_schema: {
      type: 'object',
      properties: {
        cita_id: { type: 'integer' },
        estado: {
          type: 'string',
          enum: ['programada', 'confirmada', 'cancelada'],
        },
        notas: { type: 'string' },
        confirmed: {
          type: 'boolean',
          description: 'true para ejecutar cancelación',
        },
      },
      required: ['cita_id', 'estado'],
    },
  },
  {
    name: 'reschedule_appointment',
    description:
      'Reagenda una cita a nueva fecha/hora. Para citas confirmadas requiere confirmed: true.',
    input_schema: {
      type: 'object',
      properties: {
        cita_id: { type: 'integer' },
        nueva_fecha_hora: { type: 'string', description: 'ISO 8601 datetime' },
        duracion_min: { type: 'integer' },
        confirmed: { type: 'boolean' },
      },
      required: ['cita_id', 'nueva_fecha_hora'],
    },
  },
  {
    name: 'cancel_appointment',
    description:
      'Cancela una cita. Siempre requiere confirmed: true para ejecutarse.',
    input_schema: {
      type: 'object',
      properties: {
        cita_id: { type: 'integer' },
        confirmed: { type: 'boolean' },
        motivo_cancelacion: { type: 'string' },
      },
      required: ['cita_id'],
    },
  },
  {
    name: 'get_daily_schedule',
    description: 'Agenda del día para uno o todos los médicos asignados.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'YYYY-MM-DD (default hoy)' },
        medico_id: {
          type: 'integer',
          description: 'Sin este campo, retorna todos los asignados',
        },
        incluir_canceladas: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'get_weekly_schedule',
    description: 'Agenda semanal para uno o todos los médicos asignados.',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio: {
          type: 'string',
          description: 'YYYY-MM-DD (lunes de la semana)',
        },
        medico_id: { type: 'integer' },
      },
    },
  },
  {
    name: 'send_reminder',
    description:
      'Obtiene datos de contacto del paciente y texto sugerido para recordatorio. No envía automáticamente.',
    input_schema: {
      type: 'object',
      properties: {
        cita_id: { type: 'integer' },
        canal: {
          type: 'string',
          enum: ['telefono', 'whatsapp', 'email', 'sms'],
        },
      },
      required: ['cita_id'],
    },
  },
  {
    name: 'get_no_show_list',
    description:
      'Lista citas con fecha pasada que siguen en estado programada o confirmada (no-shows).',
    input_schema: {
      type: 'object',
      properties: {
        fecha_inicio: {
          type: 'string',
          description: 'YYYY-MM-DD (default hace 7 días)',
        },
        fecha_fin: {
          type: 'string',
          description: 'YYYY-MM-DD (default ayer)',
        },
        medico_id: { type: 'integer' },
      },
    },
  },
  {
    name: 'bulk_confirm_appointments',
    description:
      'Confirma en bloque todas las citas programadas de una fecha. Requiere confirmed: true para ejecutar.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'YYYY-MM-DD' },
        medico_id: { type: 'integer' },
        confirmed: { type: 'boolean' },
      },
      required: ['fecha'],
    },
  },
  {
    name: 'get_patient_appointment_history',
    description:
      'Historial de citas de un paciente con los médicos asignados a esta secretaria.',
    input_schema: {
      type: 'object',
      properties: {
        paciente_id: { type: 'integer' },
        limit: { type: 'integer', default: 20 },
      },
      required: ['paciente_id'],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

async function executeToolForSecretary(toolName, input, secretariaId, medicoIds) {
  const guardMedico = (mid) => {
    if (mid && !medicoIds.includes(mid)) {
      throw new Error(`No tienes acceso al médico con id ${mid}`);
    }
  };

  switch (toolName) {
    case 'search_patient': {
      const { nombre, apellido, rut } = input;
      if (!nombre && !apellido && !rut) {
        return { error: 'Se requiere al menos nombre, apellido o rut' };
      }
      const orClauses = [];
      if (nombre) orClauses.push({ nombre: { [Op.like]: `%${nombre}%` } });
      if (apellido) orClauses.push({ apellido: { [Op.like]: `%${apellido}%` } });
      if (rut) orClauses.push({ rut: { [Op.like]: `%${rut}%` } });
      const pacientes = await Paciente.findAll({
        where: { activo: true, [Op.or]: orClauses },
        attributes: [
          'id',
          'nombre',
          'apellido',
          'rut',
          'telefono',
          'email',
          'prevision_salud',
          'nombre_isapre',
        ],
        order: [['apellido', 'ASC']],
        limit: 10,
      });
      return { pacientes, total: pacientes.length };
    }

    case 'get_doctor_availability': {
      const {
        medico_id,
        fecha,
        duracion_min = 30,
        hora_inicio_jornada = '08:00',
        hora_fin_jornada = '18:00',
      } = input;
      guardMedico(medico_id);

      const disponibleDia = await esFechaDisponible(medico_id, fecha);
      if (!disponibleDia) {
        const bloqueo = await AgendaBloqueo.findOne({
          where: {
            medico_id,
            tipo: 'bloqueo',
            fecha_inicio: { [Op.lte]: fecha },
            fecha_fin: { [Op.gte]: fecha },
          },
        });
        return {
          disponible: false,
          razon: 'dia_bloqueado',
          detalle: bloqueo?.motivo || 'Día bloqueado por el médico',
        };
      }

      const inicioDia = new Date(`${fecha}T00:00:00`);
      const finDia = new Date(`${fecha}T23:59:59`);

      const citasExistentes = await Cita.findAll({
        where: {
          medico_id,
          fecha_hora: { [Op.between]: [inicioDia, finDia] },
          estado: { [Op.in]: ['programada', 'confirmada'] },
        },
        attributes: ['id', 'fecha_hora', 'duracion_min'],
        include: [
          {
            model: Paciente,
            as: 'paciente',
            attributes: ['nombre', 'apellido'],
          },
        ],
        order: [['fecha_hora', 'ASC']],
      });

      const inicioJornada = new Date(`${fecha}T${hora_inicio_jornada}:00`);
      const finJornada = new Date(`${fecha}T${hora_fin_jornada}:00`);

      const slotsLibres = [];
      let cursor = new Date(inicioJornada);
      while (cursor.getTime() + duracion_min * 60000 <= finJornada.getTime()) {
        const cursorFin = new Date(cursor.getTime() + duracion_min * 60000);
        const ocupado = citasExistentes.some((c) => {
          const cIni = new Date(c.fecha_hora);
          const cFin = new Date(cIni.getTime() + (c.duracion_min || 30) * 60000);
          return cursor < cFin && cursorFin > cIni;
        });
        if (!ocupado) slotsLibres.push(cursor.toISOString());
        cursor = new Date(cursor.getTime() + 30 * 60000);
      }

      return {
        disponible: true,
        fecha,
        slots: slotsLibres,
        citas_existentes: citasExistentes.length,
        citas: citasExistentes.map((c) => ({
          id: c.id,
          fecha_hora: c.fecha_hora,
          duracion_min: c.duracion_min,
          paciente: c.paciente
            ? `${c.paciente.nombre} ${c.paciente.apellido}`
            : 'Desconocido',
        })),
      };
    }

    case 'create_appointment': {
      const { paciente_id, medico_id, fecha_hora, duracion_min = 30, motivo } = input;
      guardMedico(medico_id);

      const disponibleDia = await esFechaDisponible(medico_id, fecha_hora);
      if (!disponibleDia) {
        return { error: 'El médico tiene ese día bloqueado. Elige otro día.' };
      }

      const conflicto = await detectarConflicto(medico_id, fecha_hora, duracion_min);
      if (conflicto) {
        return { error: 'Ya existe una cita en ese horario. Elige otro slot.' };
      }

      const pacienteExiste = await Paciente.findByPk(paciente_id, { attributes: ['id'] });
      if (!pacienteExiste) return { error: 'Paciente no encontrado en el sistema' };

      const cita = await Cita.create({
        paciente_id,
        medico_id,
        secretaria_id: secretariaId,
        fecha_hora,
        duracion_min,
        motivo: motivo || null,
        estado: 'programada',
      });

      const resultado = await Cita.findByPk(cita.id, { include: INCLUDE_CITA });
      return {
        cita_id: cita.id,
        estado: 'programada',
        paciente: resultado.paciente
          ? `${resultado.paciente.nombre} ${resultado.paciente.apellido}`
          : 'Desconocido',
        medico: resultado.medico
          ? `${resultado.medico.nombre} ${resultado.medico.apellido}`
          : 'Desconocido',
        fecha_hora,
        duracion_min,
      };
    }

    case 'update_appointment_status': {
      const { cita_id, estado, notas, confirmed } = input;
      const cita = await Cita.findByPk(cita_id);
      if (!cita) return { error: 'Cita no encontrada' };
      guardMedico(cita.medico_id);

      if (estado === 'cancelada' && !confirmed) {
        const paciente = await Paciente.findByPk(cita.paciente_id, {
          attributes: ['nombre', 'apellido'],
        });
        return {
          confirmacion_requerida: true,
          mensaje: `Vas a cancelar la cita #${cita_id} de ${paciente?.nombre} ${paciente?.apellido} el ${new Date(cita.fecha_hora).toLocaleString('es-CL')}. ¿Confirmas? (responde sí/no)`,
        };
      }

      const estadoAnterior = cita.estado;
      await cita.update({
        estado,
        ...(notas !== undefined ? { notas } : {}),
      });
      return { cita_id, estado_anterior: estadoAnterior, estado_nuevo: estado };
    }

    case 'reschedule_appointment': {
      const { cita_id, nueva_fecha_hora, duracion_min, confirmed } = input;
      const cita = await Cita.findByPk(cita_id, { include: INCLUDE_CITA });
      if (!cita) return { error: 'Cita no encontrada' };
      guardMedico(cita.medico_id);

      if (cita.estado === 'cancelada') {
        return { error: 'No se puede reagendar una cita cancelada' };
      }
      if (cita.estado === 'completada') {
        return { error: 'No se puede reagendar una cita completada' };
      }

      if (cita.estado === 'confirmada' && !confirmed) {
        return {
          confirmacion_requerida: true,
          mensaje: `Vas a reagendar la cita #${cita_id} de ${cita.paciente?.nombre} ${cita.paciente?.apellido} (actualmente ${new Date(cita.fecha_hora).toLocaleString('es-CL')}) al ${new Date(nueva_fecha_hora).toLocaleString('es-CL')}. ¿Confirmas?`,
        };
      }

      const disponibleDia = await esFechaDisponible(cita.medico_id, nueva_fecha_hora);
      if (!disponibleDia) {
        return { error: 'El médico tiene ese día bloqueado. Elige otro día.' };
      }

      const dur = duracion_min || cita.duracion_min || 30;
      const conflicto = await detectarConflicto(
        cita.medico_id,
        nueva_fecha_hora,
        dur,
        cita_id
      );
      if (conflicto) {
        return { error: 'Ya existe una cita en ese horario. Elige otro slot.' };
      }

      const fechaAnterior = cita.fecha_hora;
      await cita.update({
        fecha_hora: nueva_fecha_hora,
        ...(duracion_min ? { duracion_min } : {}),
        estado: 'programada',
      });
      await cita.reload({ include: INCLUDE_CITA });

      return {
        cita_id,
        fecha_hora_anterior: fechaAnterior,
        nueva_fecha_hora,
        estado: 'programada',
        paciente: cita.paciente
          ? {
              nombre: cita.paciente.nombre,
              apellido: cita.paciente.apellido,
              telefono: cita.paciente.telefono,
            }
          : null,
      };
    }

    case 'cancel_appointment': {
      const { cita_id, confirmed, motivo_cancelacion } = input;
      const cita = await Cita.findByPk(cita_id, { include: INCLUDE_CITA });
      if (!cita) return { error: 'Cita no encontrada' };
      guardMedico(cita.medico_id);

      if (!confirmed) {
        return {
          confirmacion_requerida: true,
          mensaje: `Vas a cancelar la cita #${cita_id} de ${cita.paciente?.nombre} ${cita.paciente?.apellido} con ${cita.medico?.nombre} ${cita.medico?.apellido} el ${new Date(cita.fecha_hora).toLocaleString('es-CL')}. ¿Confirmas?`,
        };
      }

      if (cita.estado === 'cancelada') {
        return { error: 'La cita ya está cancelada' };
      }

      await cita.update({
        estado: 'cancelada',
        ...(motivo_cancelacion ? { notas: motivo_cancelacion } : {}),
      });

      return {
        cancelada: true,
        cita_id,
        fecha_hora_cancelada: cita.fecha_hora,
        paciente: cita.paciente
          ? {
              nombre: cita.paciente.nombre,
              apellido: cita.paciente.apellido,
              telefono: cita.paciente.telefono,
              email: cita.paciente.email,
            }
          : null,
      };
    }

    case 'get_daily_schedule': {
      const { medico_id, incluir_canceladas = false } = input;
      const fecha = input.fecha || new Date().toISOString().split('T')[0];

      if (medico_id) guardMedico(medico_id);
      const filtroMedicos = medico_id ? [medico_id] : medicoIds;
      if (!filtroMedicos.length) return { fecha, total: 0, citas: [] };

      const inicioDia = new Date(`${fecha}T00:00:00`);
      const finDia = new Date(`${fecha}T23:59:59`);
      const estados = incluir_canceladas
        ? ['programada', 'confirmada', 'completada', 'cancelada']
        : ['programada', 'confirmada', 'completada'];

      const citas = await Cita.findAll({
        where: {
          medico_id: { [Op.in]: filtroMedicos },
          fecha_hora: { [Op.between]: [inicioDia, finDia] },
          estado: { [Op.in]: estados },
        },
        include: INCLUDE_CITA,
        order: [
          ['medico_id', 'ASC'],
          ['fecha_hora', 'ASC'],
        ],
      });

      return { fecha, total: citas.length, citas };
    }

    case 'get_weekly_schedule': {
      const { medico_id } = input;
      if (medico_id) guardMedico(medico_id);

      let inicioSemana;
      if (input.fecha_inicio) {
        inicioSemana = new Date(`${input.fecha_inicio}T00:00:00`);
      } else {
        inicioSemana = new Date();
        const dow = inicioSemana.getDay(); // 0 = domingo
        const diff = dow === 0 ? -6 : 1 - dow;
        inicioSemana.setDate(inicioSemana.getDate() + diff);
        inicioSemana.setHours(0, 0, 0, 0);
      }
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(finSemana.getDate() + 6);
      finSemana.setHours(23, 59, 59, 999);

      const filtroMedicos = medico_id ? [medico_id] : medicoIds;
      if (!filtroMedicos.length) {
        return {
          semana_inicio: inicioSemana.toISOString().split('T')[0],
          semana_fin: finSemana.toISOString().split('T')[0],
          total_citas: 0,
          por_dia: {},
        };
      }

      const citas = await Cita.findAll({
        where: {
          medico_id: { [Op.in]: filtroMedicos },
          fecha_hora: { [Op.between]: [inicioSemana, finSemana] },
          estado: { [Op.in]: ['programada', 'confirmada', 'completada'] },
        },
        include: INCLUDE_CITA,
        order: [['fecha_hora', 'ASC']],
      });

      const porDia = {};
      for (const c of citas) {
        const dia = new Date(c.fecha_hora).toISOString().split('T')[0];
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push(c);
      }

      return {
        semana_inicio: inicioSemana.toISOString().split('T')[0],
        semana_fin: finSemana.toISOString().split('T')[0],
        total_citas: citas.length,
        por_dia: porDia,
      };
    }

    case 'send_reminder': {
      const { cita_id, canal = 'telefono' } = input;
      const cita = await Cita.findByPk(cita_id, { include: INCLUDE_CITA });
      if (!cita) return { error: 'Cita no encontrada' };
      guardMedico(cita.medico_id);

      const fechaLocal = new Date(cita.fecha_hora).toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
      });
      const textoSugerido = `Estimado/a ${cita.paciente?.nombre} ${cita.paciente?.apellido}, le recordamos su cita médica el ${fechaLocal} con ${cita.medico?.nombre} ${cita.medico?.apellido}. Confirme su asistencia o comuníquese con nosotros para reagendar.`;

      return {
        cita_id,
        canal,
        paciente: {
          nombre: cita.paciente?.nombre,
          apellido: cita.paciente?.apellido,
          telefono: cita.paciente?.telefono,
          email: cita.paciente?.email,
        },
        texto_sugerido: textoSugerido,
        nota: 'El envío del recordatorio debe realizarse manualmente por el canal indicado.',
      };
    }

    case 'get_no_show_list': {
      const { medico_id } = input;
      if (medico_id) guardMedico(medico_id);

      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      ayer.setHours(23, 59, 59, 999);
      const hace7 = new Date();
      hace7.setDate(hace7.getDate() - 7);
      hace7.setHours(0, 0, 0, 0);

      const fechaInicio = input.fecha_inicio
        ? new Date(`${input.fecha_inicio}T00:00:00`)
        : hace7;
      const fechaFin = input.fecha_fin
        ? new Date(`${input.fecha_fin}T23:59:59`)
        : ayer;

      const filtroMedicos = medico_id ? [medico_id] : medicoIds;
      if (!filtroMedicos.length) return { total_no_shows: 0, citas: [] };

      const citas = await Cita.findAll({
        where: {
          medico_id: { [Op.in]: filtroMedicos },
          fecha_hora: { [Op.between]: [fechaInicio, fechaFin] },
          estado: { [Op.in]: ['programada', 'confirmada'] },
        },
        include: INCLUDE_CITA,
        order: [['fecha_hora', 'ASC']],
      });

      return { total_no_shows: citas.length, citas };
    }

    case 'bulk_confirm_appointments': {
      const { fecha, medico_id, confirmed } = input;
      if (medico_id) guardMedico(medico_id);

      const filtroMedicos = medico_id ? [medico_id] : medicoIds;
      const inicioDia = new Date(`${fecha}T00:00:00`);
      const finDia = new Date(`${fecha}T23:59:59`);

      const citasProgramadas = await Cita.findAll({
        where: {
          medico_id: { [Op.in]: filtroMedicos },
          fecha_hora: { [Op.between]: [inicioDia, finDia] },
          estado: 'programada',
        },
        attributes: ['id'],
      });

      if (!confirmed) {
        return {
          confirmacion_requerida: true,
          citas_a_confirmar: citasProgramadas.length,
          mensaje: `Vas a confirmar ${citasProgramadas.length} cita(s) del día ${fecha}. ¿Confirmas?`,
        };
      }

      if (!citasProgramadas.length) {
        return {
          fecha,
          citas_confirmadas: 0,
          mensaje: 'No hay citas programadas para esa fecha',
        };
      }

      const ids = citasProgramadas.map((c) => c.id);
      await Cita.update(
        { estado: 'confirmada' },
        { where: { id: { [Op.in]: ids } } }
      );

      return { fecha, citas_confirmadas: ids.length };
    }

    case 'get_patient_appointment_history': {
      const { paciente_id, limit = 20 } = input;
      const citas = await Cita.findAll({
        where: {
          paciente_id,
          medico_id: { [Op.in]: medicoIds },
        },
        include: INCLUDE_CITA,
        order: [['fecha_hora', 'DESC']],
        limit: Math.min(limit, 50),
      });

      const resumen = {
        completadas: 0,
        canceladas: 0,
        programadas: 0,
        confirmadas: 0,
      };
      for (const c of citas) {
        if (c.estado === 'completada') resumen.completadas++;
        if (c.estado === 'cancelada') resumen.canceladas++;
        if (c.estado === 'programada') resumen.programadas++;
        if (c.estado === 'confirmada') resumen.confirmadas++;
      }

      return { total: citas.length, resumen, citas };
    }

    default:
      throw new Error(`Tool desconocida: ${toolName}`);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

const agentSecretaria = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Se requiere el array messages' });
    }
    if (messages.length > 50) {
      return res
        .status(400)
        .json({ message: 'Demasiados mensajes en el historial (máximo 50)' });
    }
    if (messages.some(m => typeof m?.content !== 'string' || m.content.length > 4000)) {
      return res.status(400).json({ message: 'Mensaje demasiado largo (máximo 4000 caracteres)' });
    }

    const secretariaId = req.user.id;

    const medicoIds = await verifySecretaryAccess(secretariaId);
    const medicosInfo = await getMedicosInfo(medicoIds);
    const systemPrompt = buildSystemPrompt(medicosInfo);

    const MAX_ROUNDS = 10;
    let currentMessages = [...messages];
    let rounds = 0;

    while (rounds < MAX_ROUNDS) {
      rounds++;
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        tools: SECRETARY_TOOLS,
        messages: currentMessages,
      });

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find((b) => b.type === 'text');
        return res.json({ reply: textBlock?.text || '' });
      }

      if (response.stop_reason === 'tool_use') {
        currentMessages.push({ role: 'assistant', content: response.content });

        const toolResults = [];
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;
          let result;
          try {
            result = await executeToolForSecretary(
              block.name,
              block.input,
              secretariaId,
              medicoIds
            );
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

      // stop_reason es otro valor (max_tokens, stop_sequence, etc.)
      break;
    }

    return res
      .status(500)
      .json({ message: 'El agente no pudo completar la respuesta' });
  } catch (error) {
    console.error('agentSecretaria error:', error);
    return res.status(500).json({ message: 'Error interno del agente' });
  }
};

module.exports = { agentSecretaria };
