const { Paciente } = require('../models');
const { Op } = require('sequelize');

/* ── Listar ── */
exports.listarPacientes = async (req, res) => {
  try {
    const { activo } = req.query;
    const busqueda = req.query.busqueda?.slice(0, 100);
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const where = {};
    if (activo !== undefined && activo !== '') where.activo = activo === 'true';
    if (busqueda) {
      where[Op.or] = [
        { nombre:   { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { rut:      { [Op.like]: `%${busqueda}%` } },
        { email:    { [Op.like]: `%${busqueda}%` } },
      ];
    }
    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where,
      order: [['apellido','ASC'],['nombre','ASC']],
      limit,
      offset: (page - 1) * limit,
    });
    res.json({ total: count, page, limit, pacientes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al listar pacientes' });
  }
};

/* ── Obtener uno ── */
exports.obtenerPaciente = async (req, res) => {
  try {
    const p = await Paciente.findByPk(req.params.id);
    if (!p) return res.status(404).json({ message: 'Paciente no encontrado' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener paciente' });
  }
};

/* ── Crear ── */
exports.crearPaciente = async (req, res) => {
  try {
    const {
      nombre, apellido, rut, fecha_nacimiento, genero,
      telefono, email, direccion, ciudad,
      prevision_salud, nombre_isapre, numero_fonasa,
      prevision_social, nombre_afp,
      grupo_sanguineo, alergias, antecedentes,
      contacto_emergencia_nombre, contacto_emergencia_telefono,
    } = req.body;

    if (!nombre?.trim() || !apellido?.trim() || !fecha_nacimiento || !genero)
      return res.status(400).json({ message: 'Nombre, apellido, fecha de nacimiento y género son requeridos' });

    if (rut) {
      const existe = await Paciente.findOne({ where: { rut } });
      if (existe) return res.status(400).json({ message: `Ya existe un paciente con RUT ${rut}` });
    }

    const p = await Paciente.create({
      nombre: nombre.trim(), apellido: apellido.trim(),
      rut: rut || null, fecha_nacimiento, genero,
      telefono: telefono || null, email: email || null,
      direccion: direccion || null, ciudad: ciudad || null,
      prevision_salud:  prevision_salud  || 'fonasa',
      nombre_isapre:    nombre_isapre    || null,
      numero_fonasa:    numero_fonasa    || null,
      prevision_social: prevision_social || 'ninguna',
      nombre_afp:       nombre_afp       || null,
      grupo_sanguineo:  grupo_sanguineo  || 'desconocido',
      alergias:         alergias         || null,
      antecedentes:     antecedentes     || null,
      contacto_emergencia_nombre:   contacto_emergencia_nombre   || null,
      contacto_emergencia_telefono: contacto_emergencia_telefono || null,
    });

    res.status(201).json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al crear paciente' });
  }
};

const CAMPOS_ACTUALIZABLES = [
  'nombre', 'apellido', 'rut', 'fecha_nacimiento', 'genero',
  'telefono', 'email', 'direccion', 'ciudad',
  'prevision_salud', 'nombre_isapre', 'numero_fonasa',
  'prevision_social', 'nombre_afp',
  'grupo_sanguineo', 'alergias', 'antecedentes',
  'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
];

/* ── Actualizar ── */
exports.actualizarPaciente = async (req, res) => {
  try {
    const p = await Paciente.findByPk(req.params.id);
    if (!p) return res.status(404).json({ message: 'Paciente no encontrado' });

    const datos = {};
    for (const campo of CAMPOS_ACTUALIZABLES) {
      if (req.body[campo] !== undefined) datos[campo] = req.body[campo];
    }

    await p.update(datos);
    res.json(p);
  } catch (e) {
    res.status(500).json({ message: 'Error al actualizar paciente' });
  }
};

/* ── Desactivar / Reactivar ── */
exports.desactivarPaciente = async (req, res) => {
  try {
    const p = await Paciente.findByPk(req.params.id);
    if (!p) return res.status(404).json({ message: 'Paciente no encontrado' });
    await p.update({ activo: false });
    res.json({ message: 'Paciente desactivado' });
  } catch (e) {
    res.status(500).json({ message: 'Error al desactivar paciente' });
  }
};

exports.reactivarPaciente = async (req, res) => {
  try {
    const p = await Paciente.findByPk(req.params.id);
    if (!p) return res.status(404).json({ message: 'Paciente no encontrado' });
    await p.update({ activo: true });
    res.json({ message: 'Paciente reactivado' });
  } catch (e) {
    res.status(500).json({ message: 'Error al reactivar paciente' });
  }
};
