const { Cita, Paciente, User, MedicoPerfil, Especialidad, SecretariaMedico } = require('../models');
const { Op } = require('sequelize');
const { esFechaDisponible } = require('./agendaController');

const ESTADOS_VALIDOS = new Set(['programada', 'confirmada', 'completada', 'cancelada']);

const INCLUDE_FULL = [
  {
    model: Paciente, as: 'paciente',
    attributes: ['id','nombre','apellido','rut','telefono','prevision_salud','nombre_isapre','numero_fonasa'],
  },
  {
    model: User, as: 'medico', attributes: ['id','nombre','apellido'],
    include: [{
      model: MedicoPerfil, as: 'perfil', required: false,
      include: [{ model: Especialidad, as: 'especialidad' }],
    }],
  },
];

exports.crearCita = async (req, res) => {
  try {
    const { paciente_id, medico_id, fecha_hora, duracion_min, motivo } = req.body;
    if (!paciente_id || !medico_id || !fecha_hora)
      return res.status(400).json({ message: 'Paciente, médico y fecha/hora son requeridos' });

    const disponible = await esFechaDisponible(medico_id, fecha_hora);
    if (!disponible)
      return res.status(409).json({ message: 'El médico tiene bloqueada esa fecha. Debe liberar el día antes de agendar citas.' });

    const slotLibre = await verificarSlotLibre(medico_id, fecha_hora, duracion_min || 30);
    if (!slotLibre)
      return res.status(409).json({ message: 'Ese horario ya está ocupado. Selecciona otro.' });

    const cita = await Cita.create({
      paciente_id, medico_id,
      secretaria_id: req.user.id,
      fecha_hora,
      duracion_min: duracion_min || 30,
      motivo: motivo || null,
    });

    const resultado = await Cita.findByPk(cita.id, { include: INCLUDE_FULL });
    res.status(201).json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al crear cita' });
  }
};

exports.listarCitas = async (req, res) => {
  try {
    const { medico_id, fecha_inicio, fecha_fin, estado } = req.query;
    const where = {};

    if (estado) {
      if (!ESTADOS_VALIDOS.has(estado)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }
      where.estado = estado;
    }

    if (req.user.rol === 'secretaria') {
      const asig = await SecretariaMedico.findAll({ where: { secretaria_id: req.user.id } });
      const medicoIds = asig.map(a => a.medico_id);
      if (medico_id) {
        if (!medicoIds.includes(Number(medico_id))) {
          return res.status(403).json({ message: 'Médico no asignado a esta secretaria' });
        }
        where.medico_id = medico_id;
      } else {
        where.medico_id = { [Op.in]: medicoIds };
      }
    } else {
      if (medico_id) where.medico_id = medico_id;
    }

    if (fecha_inicio || fecha_fin) {
      where.fecha_hora = {};
      if (fecha_inicio) where.fecha_hora[Op.gte] = new Date(fecha_inicio);
      if (fecha_fin)    where.fecha_hora[Op.lte]  = new Date(fecha_fin);
    }

    const citas = await Cita.findAll({ where, include: INCLUDE_FULL, order: [['fecha_hora','ASC']] });
    res.json(citas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al listar citas' });
  }
};

async function verificarSlotLibre(medico_id, fecha_hora, duracion_min = 30, excluir_cita_id = null) {
  const diaStr   = fecha_hora.split('T')[0];
  const diaInicio = new Date(`${diaStr}T00:00:00`);
  const diaFin    = new Date(`${diaStr}T23:59:59`);

  const where = {
    medico_id,
    fecha_hora: { [Op.between]: [diaInicio, diaFin] },
    estado: { [Op.ne]: 'cancelada' },
  };
  if (excluir_cita_id) where.id = { [Op.ne]: excluir_cita_id };

  const citasDelDia = await Cita.findAll({ where, attributes: ['fecha_hora', 'duracion_min'] });

  const slotInicio = new Date(fecha_hora).getTime();
  const slotFin    = slotInicio + duracion_min * 60000;

  return !citasDelDia.some((c) => {
    const ini = new Date(c.fecha_hora).getTime();
    const fin = ini + c.duracion_min * 60000;
    return ini < slotFin && fin > slotInicio;
  });
}

exports.reagendarCita = async (req, res) => {
  try {
    const c = await Cita.findByPk(req.params.id);
    if (!c) return res.status(404).json({ message: 'Cita no encontrada' });
    if (c.estado === 'cancelada')
      return res.status(400).json({ message: 'No se puede reagendar una cita cancelada' });

    const { fecha_hora, duracion_min } = req.body;
    if (!fecha_hora) return res.status(400).json({ message: 'La nueva fecha/hora es requerida' });

    const disponible = await esFechaDisponible(c.medico_id, fecha_hora);
    if (!disponible)
      return res.status(409).json({ message: 'El médico tiene bloqueada esa fecha. Debe liberar el día antes de reagendar.' });

    const slotLibre = await verificarSlotLibre(c.medico_id, fecha_hora, duracion_min || c.duracion_min, c.id);
    if (!slotLibre)
      return res.status(409).json({ message: 'Ese horario ya está ocupado. Selecciona otro.' });

    await c.update({ fecha_hora, ...(duracion_min ? { duracion_min } : {}), estado: 'programada' });
    const resultado = await Cita.findByPk(c.id, { include: INCLUDE_FULL });
    res.json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al reagendar cita' });
  }
};

exports.cancelarCita = async (req, res) => {
  try {
    const c = await Cita.findByPk(req.params.id);
    if (!c) return res.status(404).json({ message: 'Cita no encontrada' });
    if (c.estado === 'cancelada')
      return res.status(400).json({ message: 'La cita ya está cancelada' });
    await c.update({ estado: 'cancelada' });
    res.json({ message: 'Cita cancelada' });
  } catch (e) {
    res.status(500).json({ message: 'Error al cancelar cita' });
  }
};

// Paciente solicita una cita (vinculación por RUT, secretaria_id = null)
exports.solicitarCita = async (req, res) => {
  try {
    const { medico_id, fecha_hora, motivo } = req.body;
    if (!medico_id || !fecha_hora)
      return res.status(400).json({ message: 'medico_id y fecha_hora son requeridos' });

    const userRut = req.user.rut;
    if (!userRut)
      return res.status(400).json({ message: 'Tu cuenta no tiene RUT registrado. Contacta a la secretaría.' });

    const paciente = await Paciente.findOne({ where: { rut: userRut } });
    if (!paciente)
      return res.status(404).json({ message: 'No se encontró tu ficha de paciente. Contacta a la secretaría.' });

    const medicoExiste = await User.findOne({ where: { id: medico_id, activo: true }, attributes: ['id'] });
    if (!medicoExiste)
      return res.status(404).json({ message: 'Médico no encontrado' });

    const diaDisponible = await esFechaDisponible(medico_id, fecha_hora);
    if (!diaDisponible)
      return res.status(409).json({ message: 'El médico no tiene disponibilidad en esa fecha.' });

    const slotLibre = await verificarSlotLibre(medico_id, fecha_hora, 30);
    if (!slotLibre)
      return res.status(409).json({ message: 'Ese horario ya no está disponible. Por favor elige otro.' });

    const cita = await Cita.create({
      paciente_id:   paciente.id,
      medico_id,
      secretaria_id: null,
      fecha_hora,
      duracion_min:  30,
      motivo:        motivo || null,
      estado:        'programada',
    });

    res.status(201).json({
      message: 'Solicitud de cita registrada. La secretaría confirmará tu hora.',
      cita_id: cita.id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al solicitar la cita' });
  }
};
