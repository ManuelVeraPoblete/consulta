const { Notificacion, User, SecretariaMedico, MedicoPerfil, Especialidad } = require('../models');
const { Op } = require('sequelize');

const INCLUDE_EMISOR = [{
  model: User,
  as: 'emisor',
  attributes: ['id', 'nombre', 'apellido', 'rol'],
}];

/* ── helpers ─────────────────────────────────────────────── */

async function getMedicoIdsDeSecretaria(secretariaId) {
  const asig = await SecretariaMedico.findAll({ where: { secretaria_id: secretariaId } });
  return asig.map(a => a.medico_id);
}

async function getSecretariaIdsDesMedico(medicoId) {
  const asig = await SecretariaMedico.findAll({ where: { medico_id: medicoId } });
  return asig.map(a => a.secretaria_id);
}

/* ── GET /destinatarios ──────────────────────────────────── */
exports.getDestinatarios = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    let usuarios = [];

    if (rol === 'medico') {
      const ids = await getSecretariaIdsDesMedico(userId);
      if (!ids.length) return res.json([]);
      usuarios = await User.findAll({
        where: { id: { [Op.in]: ids }, activo: true },
        attributes: ['id', 'nombre', 'apellido', 'rol'],
      });
    } else if (rol === 'secretaria') {
      const ids = await getMedicoIdsDeSecretaria(userId);
      if (!ids.length) return res.json([]);
      usuarios = await User.findAll({
        where: { id: { [Op.in]: ids }, activo: true },
        attributes: ['id', 'nombre', 'apellido', 'rol'],
        include: [{
          model: MedicoPerfil,
          as: 'perfil',
          required: false,
          include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
        }],
      });
    } else if (rol === 'admin') {
      usuarios = await User.findAll({
        where: { activo: true, rol: { [Op.in]: ['medico', 'secretaria'] }, id: { [Op.ne]: userId } },
        attributes: ['id', 'nombre', 'apellido', 'rol'],
        include: [{
          model: MedicoPerfil,
          as: 'perfil',
          required: false,
          include: [{ model: Especialidad, as: 'especialidad', attributes: ['nombre'] }],
        }],
        order: [['rol', 'ASC'], ['apellido', 'ASC']],
      });
    }

    res.json(usuarios);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener destinatarios' });
  }
};

/* ── POST /enviar ────────────────────────────────────────── */
exports.enviarNotificacion = async (req, res) => {
  try {
    const { id: emisorId, rol } = req.user;
    const { receptor_ids, titulo, mensaje } = req.body;

    if (!titulo?.trim())  return res.status(400).json({ message: 'El título es requerido' });
    if (!mensaje?.trim()) return res.status(400).json({ message: 'El mensaje es requerido' });
    if (titulo.trim().length > 200) return res.status(400).json({ message: 'Título demasiado largo (máx 200 caracteres)' });

    let destinatarios = [];

    if (receptor_ids === 'todos') {
      if (rol !== 'admin') return res.status(403).json({ message: 'Solo el administrador puede enviar a todos' });
      const todos = await User.findAll({
        where: { activo: true, rol: { [Op.in]: ['medico', 'secretaria'] }, id: { [Op.ne]: emisorId } },
        attributes: ['id'],
      });
      destinatarios = todos.map(u => u.id);
    } else if (Array.isArray(receptor_ids) && receptor_ids.length > 0) {
      const ids = receptor_ids.map(Number).filter(Boolean);

      if (rol === 'medico') {
        const permitidos = await getSecretariaIdsDesMedico(emisorId);
        const noPermitidos = ids.filter(id => !permitidos.includes(id));
        if (noPermitidos.length) return res.status(403).json({ message: 'No tienes permiso para enviar a algunos destinatarios' });
      } else if (rol === 'secretaria') {
        const permitidos = await getMedicoIdsDeSecretaria(emisorId);
        const noPermitidos = ids.filter(id => !permitidos.includes(id));
        if (noPermitidos.length) return res.status(403).json({ message: 'No tienes permiso para enviar a algunos destinatarios' });
      }

      destinatarios = ids;
    } else {
      return res.status(400).json({ message: 'Se requiere al menos un destinatario' });
    }

    if (!destinatarios.length) return res.status(400).json({ message: 'No hay destinatarios válidos' });

    await Notificacion.bulkCreate(destinatarios.map(receptor_id => ({
      emisor_id:   emisorId,
      receptor_id,
      titulo:      titulo.trim(),
      mensaje:     mensaje.trim(),
      leida:       false,
    })));

    res.status(201).json({ enviadas: destinatarios.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al enviar notificación' });
  }
};

/* ── GET /mis-notificaciones ─────────────────────────────── */
exports.getMisNotificaciones = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const notifs = await Notificacion.findAll({
      where: { receptor_id: req.user.id },
      include: INCLUDE_EMISOR,
      order: [['createdAt', 'DESC']],
      limit,
    });
    res.json(notifs);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

/* ── GET /no-leidas/count ────────────────────────────────── */
exports.contarNoLeidas = async (req, res) => {
  try {
    const count = await Notificacion.count({
      where: { receptor_id: req.user.id, leida: false },
    });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: 'Error al contar notificaciones' });
  }
};

/* ── PATCH /:id/leer ─────────────────────────────────────── */
exports.marcarLeida = async (req, res) => {
  try {
    const notif = await Notificacion.findByPk(req.params.id);
    if (!notif)                             return res.status(404).json({ message: 'Notificación no encontrada' });
    if (notif.receptor_id !== req.user.id)  return res.status(403).json({ message: 'Sin permiso' });
    await notif.update({ leida: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
};

/* ── PATCH /leer-todas ───────────────────────────────────── */
exports.marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.update(
      { leida: true },
      { where: { receptor_id: req.user.id, leida: false } }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error al marcar notificaciones' });
  }
};
