const { AtencionMedica, Cita, Paciente, User, MedicoPerfil, Especialidad, Receta, RecetaItem, SecretariaMedico } = require('../models');
const { Op } = require('sequelize');

const INCLUDE_FULL = [
  { model: Paciente, as: 'paciente', attributes: ['id','nombre','apellido','rut','fecha_nacimiento','telefono','prevision_salud','alergias','antecedentes'] },
  { model: User,     as: 'medico',   attributes: ['id','nombre','apellido'],
    include: [{ model: MedicoPerfil, as: 'perfil', required: false, include: [{ model: Especialidad, as: 'especialidad' }] }] },
  { model: Cita,     as: 'cita',     attributes: ['id','fecha_hora','motivo','estado'] },
  { model: Receta,   as: 'receta',   required: false,
    include: [{ model: RecetaItem, as: 'items' }] },
];

exports.crearAtencion = async (req, res) => {
  try {
    const medicoId = req.user.id;
    const {
      cita_id, paciente_id,
      presion_sistolica, presion_diastolica, frecuencia_cardiaca,
      temperatura, peso, talla, saturacion_oxigeno,
      motivo_consulta, anamnesis, examen_fisico,
      diagnostico, cie10, plan_tratamiento, indicaciones,
      receta,
    } = req.body;

    if (!cita_id || !paciente_id)
      return res.status(400).json({ message: 'cita_id y paciente_id son requeridos' });
    if (!motivo_consulta?.trim())
      return res.status(400).json({ message: 'El motivo de consulta es requerido' });
    if (!diagnostico?.trim())
      return res.status(400).json({ message: 'El diagnóstico es requerido' });

    const cita = await Cita.findByPk(cita_id);
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' });
    if (cita.medico_id !== medicoId)
      return res.status(403).json({ message: 'No tienes permiso para esta cita' });

    const existe = await AtencionMedica.findOne({ where: { cita_id } });
    if (existe) return res.status(409).json({ message: 'Esta cita ya tiene una atención registrada' });

    const atencion = await AtencionMedica.create({
      cita_id, paciente_id, medico_id: medicoId,
      presion_sistolica:   presion_sistolica   || null,
      presion_diastolica:  presion_diastolica  || null,
      frecuencia_cardiaca: frecuencia_cardiaca || null,
      temperatura:         temperatura         || null,
      peso:                peso                || null,
      talla:               talla               || null,
      saturacion_oxigeno:  saturacion_oxigeno  || null,
      motivo_consulta: motivo_consulta.trim(),
      anamnesis:       anamnesis?.trim()       || null,
      examen_fisico:   examen_fisico?.trim()   || null,
      diagnostico:     diagnostico.trim(),
      cie10:           cie10?.trim()           || null,
      plan_tratamiento: plan_tratamiento?.trim() || null,
      indicaciones:    indicaciones?.trim()    || null,
    });

    // Guardar receta si viene con ítems válidos
    const itemsValidos = (receta?.items ?? []).filter(i => i.medicamento?.trim());
    if (itemsValidos.length > 0) {
      const recetaCreada = await Receta.create({
        atencion_id:   atencion.id,
        paciente_id:   atencion.paciente_id,
        medico_id:     medicoId,
        observaciones: receta.observaciones?.trim() || null,
      });
      await RecetaItem.bulkCreate(itemsValidos.map(i => ({
        receta_id:    recetaCreada.id,
        medicamento:  i.medicamento.trim(),
        dosis:        i.dosis?.trim()        || null,
        frecuencia:   i.frecuencia?.trim()   || null,
        duracion:     i.duracion?.trim()     || null,
        indicaciones: i.indicaciones?.trim() || null,
      })));
    }

    // Marcar la cita como completada
    await cita.update({ estado: 'completada' });

    const resultado = await AtencionMedica.findByPk(atencion.id, { include: INCLUDE_FULL });
    res.status(201).json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error al registrar atención' });
  }
};

exports.getAtencionByCita = async (req, res) => {
  try {
    const atencion = await AtencionMedica.findOne({
      where: { cita_id: req.params.citaId },
      include: INCLUDE_FULL,
    });
    if (!atencion) return res.status(404).json({ message: 'Atención no encontrada' });

    if (req.user.rol === 'medico' && atencion.medico_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    if (req.user.rol === 'secretaria') {
      const asig = await SecretariaMedico.findOne({ where: { secretaria_id: req.user.id, medico_id: atencion.medico_id } });
      if (!asig) return res.status(403).json({ message: 'Acceso denegado' });
    }

    res.json(atencion);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener atención' });
  }
};

exports.getRecetaByAtencion = async (req, res) => {
  try {
    const receta = await Receta.findOne({
      where: { atencion_id: req.params.atencionId },
      include: [{ model: RecetaItem, as: 'items' }],
    });
    if (!receta) return res.status(404).json({ message: 'Sin receta' });

    if (req.user.rol === 'medico' && receta.medico_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    if (req.user.rol === 'secretaria') {
      const asig = await SecretariaMedico.findOne({ where: { secretaria_id: req.user.id, medico_id: receta.medico_id } });
      if (!asig) return res.status(403).json({ message: 'Acceso denegado' });
    }

    res.json(receta);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener receta' });
  }
};

exports.getHistorialPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.pacienteId;

    if (req.user.rol === 'medico') {
      const tieneCita = await Cita.findOne({
        where: { medico_id: req.user.id, paciente_id: pacienteId },
      });
      if (!tieneCita) return res.status(403).json({ message: 'Acceso denegado' });
    }
    if (req.user.rol === 'secretaria') {
      const asig = await SecretariaMedico.findAll({ where: { secretaria_id: req.user.id } });
      const medicoIds = asig.map(a => a.medico_id);
      const tieneCita = medicoIds.length
        ? await Cita.findOne({ where: { medico_id: { [Op.in]: medicoIds }, paciente_id: pacienteId } })
        : null;
      if (!tieneCita) return res.status(403).json({ message: 'Acceso denegado' });
    }

    const atenciones = await AtencionMedica.findAll({
      where: { paciente_id: pacienteId },
      include: INCLUDE_FULL,
      order: [['createdAt', 'DESC']],
    });
    res.json(atenciones);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};
