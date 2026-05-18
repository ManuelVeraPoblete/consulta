const { Op } = require('sequelize');
const { User, MedicoPerfil, Especialidad, Prevision, MedicoPrevision, SecretariaMedico, Cita, Paciente, AtencionMedica } = require('../models');

exports.getDashboardStats = async (req, res) => {
  try {
    const secretariaId = req.user.id;

    // Médicos asignados a esta secretaria
    const asignaciones = await SecretariaMedico.findAll({ where: { secretaria_id: secretariaId } });
    const medicoIds = asignaciones.map(a => a.medico_id);

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const mesInicio = new Date();
    mesInicio.setDate(1);
    mesInicio.setHours(0, 0, 0, 0);

    const [citasHoy, atencionesCompletadas, medicosActivos] = await Promise.all([
      medicoIds.length
        ? Cita.count({
            where: {
              medico_id: { [Op.in]: medicoIds },
              fecha_hora: { [Op.between]: [hoyInicio, hoyFin] },
              estado: { [Op.in]: ['programada', 'confirmada', 'completada'] },
            },
          })
        : 0,
      medicoIds.length
        ? Cita.count({
            where: {
              medico_id: { [Op.in]: medicoIds },
              fecha_hora: { [Op.between]: [hoyInicio, hoyFin] },
              estado: 'completada',
            },
          })
        : 0,
      medicoIds.length,
    ]);

    // Pacientes nuevos este mes que tienen al menos una cita con los médicos de esta secretaria
    const pacientesNuevos = medicoIds.length
      ? await Paciente.count({
          where: { createdAt: { [Op.gte]: mesInicio } },
          include: [{ model: Cita, as: 'citas', where: { medico_id: { [Op.in]: medicoIds } }, required: true }],
        })
      : 0;

    // Próximas citas
    const proximasCitas = medicoIds.length
      ? await Cita.findAll({
          where: {
            medico_id: { [Op.in]: medicoIds },
            fecha_hora: { [Op.gt]: new Date() },
            estado: { [Op.in]: ['programada', 'confirmada'] },
          },
          include: [
            { model: Paciente, as: 'paciente', attributes: ['nombre', 'apellido'] },
            { model: User, as: 'medico', attributes: ['nombre', 'apellido'] },
          ],
          order: [['fecha_hora', 'ASC']],
          limit: 5,
        })
      : [];

    // Últimas atenciones completadas
    const ultimasAtenciones = medicoIds.length
      ? await Cita.findAll({
          where: {
            medico_id: { [Op.in]: medicoIds },
            estado: 'completada',
          },
          include: [
            { model: Paciente, as: 'paciente', attributes: ['nombre', 'apellido'] },
            { model: User, as: 'medico', attributes: ['nombre', 'apellido'] },
          ],
          order: [['fecha_hora', 'DESC']],
          limit: 5,
        })
      : [];

    res.json({
      citasHoy,
      pacientesNuevos,
      atencionesCompletadas,
      medicosActivos,
      proximasCitas,
      ultimasAtenciones,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

exports.getInformeDiario = async (req, res) => {
  try {
    const secretariaId = req.user.id;
    const hoy          = new Date().toISOString().split('T')[0];
    const fechaInicio  = req.query.fechaInicio || hoy;
    const fechaFin     = req.query.fechaFin    || fechaInicio;
    const medicoId     = req.query.medicoId ? Number(req.query.medicoId) : null;

    const asignaciones = await SecretariaMedico.findAll({ where: { secretaria_id: secretariaId } });
    const medicoIds    = asignaciones.map(a => a.medico_id);
    if (!medicoIds.length) return res.json({ fechaInicio, fechaFin, medico: null, grupos: [], total_general: 0, total_atenciones: 0 });

    if (medicoId && !medicoIds.includes(medicoId))
      return res.status(403).json({ message: 'Médico no asignado a esta secretaria' });

    const filtroMedico = medicoId ? medicoId : { [Op.in]: medicoIds };

    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin    = new Date(fechaFin    + 'T23:59:59');

    const [atenciones, medicoData] = await Promise.all([
      AtencionMedica.findAll({
        where: { medico_id: filtroMedico },
        include: [
          { model: Paciente, as: 'paciente', attributes: ['prevision_salud', 'nombre_isapre'] },
          { model: User,     as: 'medico',   attributes: ['nombre', 'apellido'],
            include: [{ model: MedicoPerfil, as: 'perfil', required: false,
              include: [{ model: Especialidad, as: 'especialidad' }],
              attributes: ['valor_particular'] }] },
          { model: Cita,     as: 'cita',     attributes: ['fecha_hora'],
            where: { fecha_hora: { [Op.between]: [inicio, fin] } }, required: true },
        ],
      }),
      medicoId
        ? User.findByPk(medicoId, {
            attributes: ['id', 'nombre', 'apellido'],
            include: [{ model: MedicoPerfil, as: 'perfil', required: false,
              include: [{ model: Especialidad, as: 'especialidad' }] }],
          })
        : null,
    ]);

    const grupos = {};
    for (const a of atenciones) {
      const prevision    = a.paciente?.prevision_salud;
      const valor        = Number(a.medico?.perfil?.valor_particular) || 0;
      const nombreIsapre = a.paciente?.nombre_isapre?.trim() || 'ISAPRE';

      let key, entrada;
      if (prevision === 'fonasa') {
        key = 'fonasa';
        entrada = grupos[key] ?? (grupos[key] = { tipo: 'fonasa', nombre: 'FONASA', atenciones: 0, total: 0 });
      } else if (prevision === 'isapre') {
        key = 'isapre_' + nombreIsapre.toLowerCase();
        entrada = grupos[key] ?? (grupos[key] = { tipo: 'isapre', nombre: nombreIsapre, atenciones: 0, total: 0 });
      } else {
        key = 'particular';
        entrada = grupos[key] ?? (grupos[key] = { tipo: 'particular', nombre: 'Particular', atenciones: 0, total: 0 });
      }
      entrada.atenciones++;
      entrada.total += valor;
    }

    const resultado       = Object.values(grupos);
    const total_general   = resultado.reduce((s, g) => s + g.total, 0);
    const total_atenciones= resultado.reduce((s, g) => s + g.atenciones, 0);

    const medico = medicoData ? {
      id:          medicoData.id,
      nombre:      medicoData.nombre,
      apellido:    medicoData.apellido,
      especialidad: medicoData.perfil?.especialidad?.nombre ?? null,
    } : null;

    res.json({ fechaInicio, fechaFin, medico, grupos: resultado, total_general, total_atenciones });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al generar informe' });
  }
};

exports.getAtenciones = async (req, res) => {
  try {
    const secretariaId = req.user.id;
    const asignaciones = await SecretariaMedico.findAll({ where: { secretaria_id: secretariaId } });
    const medicoIds = asignaciones.map(a => a.medico_id);

    if (!medicoIds.length) return res.json([]);

    const atenciones = await AtencionMedica.findAll({
      where: { medico_id: { [Op.in]: medicoIds } },
      include: [
        { model: Paciente, as: 'paciente', attributes: ['id','nombre','apellido','rut','prevision_salud'] },
        { model: User,     as: 'medico',   attributes: ['id','nombre','apellido'],
          include: [{ model: MedicoPerfil, as: 'perfil', required: false,
            include: [{ model: Especialidad, as: 'especialidad' }] }] },
        { model: Cita,     as: 'cita',     attributes: ['id','fecha_hora'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(atenciones);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener atenciones' });
  }
};

exports.misMedicos = async (req, res) => {
  try {
    const secretaria = await User.findByPk(req.user.id, {
      include: [{
        model: User,
        as: 'medicosAsignados',
        required: false,
        include: [{
          model: MedicoPerfil,
          as: 'perfil',
          required: false,
          include: [
            { model: Especialidad, as: 'especialidad' },
            { model: Prevision,    as: 'previsiones', through: { attributes: [] } },
          ],
        }],
      }],
    });

    if (!secretaria) return res.status(404).json({ message: 'Secretaria no encontrada' });

    res.json(secretaria.medicosAsignados ?? []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al obtener médicos asignados' });
  }
};
