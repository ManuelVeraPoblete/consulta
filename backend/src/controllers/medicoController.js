const { Op } = require('sequelize');
const { MedicoPerfil, User, Cita, Paciente, AtencionMedica, Receta, RecetaItem, Especialidad: EspecialidadModel } = require('../models');

const buscarMedicos = async (req, res) => {
  try {
    const { especialidad, nombre, modalidad } = req.query;

    const perfilWhere = {};
    if (especialidad)          perfilWhere.especialidad      = especialidad;
    if (modalidad === 'fonasa')    perfilWhere.acepta_fonasa     = true;
    if (modalidad === 'isapre')    perfilWhere.acepta_isapre     = true;
    if (modalidad === 'particular') perfilWhere.acepta_particular = true;

    const usuarioWhere = { activo: true };
    if (nombre) {
      usuarioWhere[Op.or] = [
        { nombre:   { [Op.like]: `%${nombre}%` } },
        { apellido: { [Op.like]: `%${nombre}%` } },
      ];
    }

    const medicos = await MedicoPerfil.findAll({
      where: perfilWhere,
      include: [{
        model: User,
        as: 'usuario',
        attributes: ['nombre', 'apellido'],
        where: usuarioWhere,
      }],
      order: [['especialidad', 'ASC'], [{ model: User, as: 'usuario' }, 'apellido', 'ASC']],
    });

    res.json({ medicos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar médicos' });
  }
};

const getEspecialidades = async (req, res) => {
  try {
    const especialidades = await EspecialidadModel.findAll({ where: { activo: true }, order: [['nombre', 'ASC']] });
    res.json({ especialidades });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener especialidades' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const medicoId = req.user.id;

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const INCLUDE_PACIENTE = [
      { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'rut', 'telefono', 'prevision_salud'] },
    ];

    // Todas las citas de hoy (excepto canceladas)
    const agendaHoy = await Cita.findAll({
      where: {
        medico_id: medicoId,
        fecha_hora: { [Op.between]: [hoyInicio, hoyFin] },
        estado: { [Op.ne]: 'cancelada' },
      },
      include: INCLUDE_PACIENTE,
      order: [['fecha_hora', 'ASC']],
    });

    const atencionesHoy = agendaHoy.length;

    // Próxima cita desde ahora
    const ahora = new Date();
    const proximaCita = await Cita.findOne({
      where: {
        medico_id: medicoId,
        fecha_hora: { [Op.gte]: ahora },
        estado: { [Op.in]: ['programada', 'confirmada'] },
      },
      include: INCLUDE_PACIENTE,
      order: [['fecha_hora', 'ASC']],
    });

    // Paciente actualmente en atención (cita confirmada cuya hora ya pasó, en la última hora)
    const haceUnaHora = new Date(ahora.getTime() - 60 * 60 * 1000);
    const enAtencion = await Cita.findOne({
      where: {
        medico_id: medicoId,
        fecha_hora: { [Op.between]: [haceUnaHora, ahora] },
        estado: 'confirmada',
      },
      include: INCLUDE_PACIENTE,
      order: [['fecha_hora', 'DESC']],
    });

    res.json({
      atencionesHoy,
      proximoPaciente: proximaCita?.paciente
        ? `${proximaCita.paciente.nombre} ${proximaCita.paciente.apellido}`
        : null,
      proximaCita,
      enAtencion,
      recetasEmitidas: 0,
      ordenesExamen: 0,
      agendaHoy,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener dashboard' });
  }
};

const getMisCitas = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const { fecha } = req.query;

    const where = { medico_id: medicoId };

    if (fecha) {
      const [y, m, d] = fecha.split('-').map(Number);
      const inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
      const fin    = new Date(y, m - 1, d, 23, 59, 59, 999);
      where.fecha_hora = { [Op.between]: [inicio, fin] };
    }

    const citas = await Cita.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id', 'nombre', 'apellido', 'rut', 'telefono'] },
      ],
      order: [['fecha_hora', 'ASC']],
    });

    res.json(citas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener citas' });
  }
};

const getMisPacientes = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const { busqueda } = req.query;

    // Solo pacientes con atención médica real registrada con este médico
    const atencionesRaw = await AtencionMedica.findAll({
      where: { medico_id: medicoId },
      attributes: ['paciente_id'],
      group: ['paciente_id'],
      raw: true,
    });

    const pacienteIds = atencionesRaw.map(a => a.paciente_id);
    if (!pacienteIds.length) return res.json({ pacientes: [] });

    const where = { id: { [Op.in]: pacienteIds } };
    if (busqueda) {
      where[Op.or] = [
        { nombre:   { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { rut:      { [Op.like]: `%${busqueda}%` } },
      ];
    }

    const pacientes = await Paciente.findAll({
      where,
      attributes: ['id', 'nombre', 'apellido', 'rut', 'fecha_nacimiento', 'prevision_salud', 'activo'],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
      include: [{
        model: AtencionMedica,
        as: 'atenciones',
        where: { medico_id: medicoId },
        attributes: ['paciente_id', 'diagnostico', 'createdAt'],
        required: false,
        separate: true,
        order: [['createdAt', 'DESC']],
      }],
    });

    const result = pacientes.map((p) => {
      const ultima = p.atenciones?.[0] ?? null;
      return {
        ...p.toJSON(),
        ultimaAtencion: ultima?.createdAt ?? null,
        diagnostico:    ultima?.diagnostico ?? null,
        atenciones: undefined,
      };
    });

    res.json({ pacientes: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener pacientes' });
  }
};

const getMisRecetas = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const { busqueda } = req.query;

    const pacienteWhere = busqueda
      ? {
          [Op.or]: [
            { nombre:   { [Op.like]: `%${busqueda}%` } },
            { apellido: { [Op.like]: `%${busqueda}%` } },
            { rut:      { [Op.like]: `%${busqueda}%` } },
          ],
        }
      : undefined;

    const recetas = await Receta.findAll({
      where: { medico_id: medicoId },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['id', 'nombre', 'apellido', 'rut', 'fecha_nacimiento', 'prevision_salud'],
          ...(pacienteWhere ? { where: pacienteWhere } : {}),
          required: !!busqueda,
        },
        { model: RecetaItem, as: 'items' },
        {
          model: AtencionMedica,
          as: 'atencion',
          attributes: [
            'id', 'motivo_consulta', 'anamnesis', 'examen_fisico',
            'diagnostico', 'cie10', 'plan_tratamiento', 'indicaciones',
            'presion_sistolica', 'presion_diastolica', 'frecuencia_cardiaca',
            'temperatura', 'peso', 'talla', 'saturacion_oxigeno',
          ],
          include: [{ model: Cita, as: 'cita', attributes: ['id', 'fecha_hora', 'motivo'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(recetas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener recetas' });
  }
};

module.exports = { buscarMedicos, getEspecialidades, getDashboard, getMisCitas, getMisPacientes, getMisRecetas };
