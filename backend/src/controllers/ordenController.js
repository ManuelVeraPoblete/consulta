const { OrdenExamen, OrdenExamenItem, Paciente, User, MedicoPerfil, Especialidad, Cita } = require('../models');
const { Op } = require('sequelize');

const INCLUDE_FULL = [
  {
    model: Paciente,
    as: 'paciente',
    attributes: ['id', 'nombre', 'apellido', 'rut', 'fecha_nacimiento', 'prevision_salud', 'nombre_isapre'],
  },
  {
    model: User,
    as: 'medico',
    attributes: ['id', 'nombre', 'apellido'],
    include: [{
      model: MedicoPerfil,
      as: 'perfil',
      required: false,
      include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
    }],
  },
  { model: OrdenExamenItem, as: 'items' },
  { model: Cita, as: 'cita', required: false, attributes: ['id', 'fecha_hora', 'motivo'] },
];

const URGENCIAS = ['rutina', 'urgente', 'muy_urgente'];
const ESTADOS   = ['pendiente', 'realizado', 'cancelado'];

exports.crearOrden = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const {
      paciente_id, cita_id, atencion_id,
      diagnostico_presuntivo, instrucciones_generales,
      urgencia = 'rutina', items = [],
    } = req.body;

    if (!paciente_id) return res.status(400).json({ message: 'paciente_id es requerido' });
    if (!URGENCIAS.includes(urgencia)) return res.status(400).json({ message: 'Urgencia no válida' });

    const itemsValidos = items.filter(i => i.nombre_examen?.trim());
    if (!itemsValidos.length) return res.status(400).json({ message: 'Se requiere al menos un examen' });

    const tieneCita = await Cita.findOne({ where: { medico_id: medicoId, paciente_id } });
    if (!tieneCita) return res.status(403).json({ message: 'Solo puedes emitir órdenes a pacientes con cita registrada' });

    const orden = await OrdenExamen.create({
      medico_id: medicoId,
      paciente_id,
      cita_id: cita_id || null,
      atencion_id: atencion_id || null,
      diagnostico_presuntivo: diagnostico_presuntivo?.trim() || null,
      instrucciones_generales: instrucciones_generales?.trim() || null,
      urgencia,
    });

    await OrdenExamenItem.bulkCreate(itemsValidos.map(i => ({
      orden_id:      orden.id,
      tipo:          ['laboratorio', 'imagen', 'electrocardiograma', 'otro'].includes(i.tipo) ? i.tipo : 'laboratorio',
      nombre_examen: i.nombre_examen.trim(),
      codigo:        i.codigo?.trim() || null,
      instrucciones: i.instrucciones?.trim() || null,
    })));

    const resultado = await OrdenExamen.findByPk(orden.id, { include: INCLUDE_FULL });
    res.status(201).json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al crear orden de examen' });
  }
};

exports.getMisOrdenes = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const { busqueda, estado } = req.query;

    const where = { medico_id: medicoId };
    if (estado && ESTADOS.includes(estado)) where.estado = estado;

    const ordenes = await OrdenExamen.findAll({
      where,
      include: INCLUDE_FULL,
      order: [['createdAt', 'DESC']],
      limit: 200,
    });

    if (!busqueda?.trim()) return res.json(ordenes);

    const q = busqueda.trim().toLowerCase();
    const filtradas = ordenes.filter(o => {
      const nombre = `${o.paciente?.nombre ?? ''} ${o.paciente?.apellido ?? ''}`.toLowerCase();
      const rut    = (o.paciente?.rut ?? '').toLowerCase();
      return nombre.includes(q) || rut.includes(q);
    });

    res.json(filtradas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
};

exports.getOrdenByCita = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const orden = await OrdenExamen.findOne({
      where: { cita_id: req.params.citaId, medico_id: medicoId },
      include: INCLUDE_FULL,
    });
    if (!orden) return res.status(404).json({ message: 'No hay orden de examen para esta cita' });
    res.json(orden);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener orden' });
  }
};

exports.getOrdenesPaciente = async (req, res) => {
  try {
    const medicoId  = req.user.id;
    const pacienteId = req.params.pacienteId;

    const tieneCita = await Cita.findOne({ where: { medico_id: medicoId, paciente_id: pacienteId } });
    if (!tieneCita) return res.status(403).json({ message: 'Acceso denegado' });

    const ordenes = await OrdenExamen.findAll({
      where: { medico_id: medicoId, paciente_id: pacienteId },
      include: INCLUDE_FULL,
      order: [['createdAt', 'DESC']],
    });
    res.json(ordenes);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener órdenes del paciente' });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const { estado } = req.body;

    if (!ESTADOS.includes(estado)) return res.status(400).json({ message: 'Estado no válido' });

    const orden = await OrdenExamen.findByPk(req.params.id);
    if (!orden)                        return res.status(404).json({ message: 'Orden no encontrada' });
    if (orden.medico_id !== medicoId)  return res.status(403).json({ message: 'Sin permiso' });

    await orden.update({ estado });
    res.json({ id: orden.id, estado });
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};
