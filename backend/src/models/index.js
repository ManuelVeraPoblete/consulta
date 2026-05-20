// backend/src/models/index.js

const sequelize = require('../config/database');

const { User, ROLES } = require('./User');
const { MedicoPerfil } = require('./MedicoPerfil');
const { Prevision } = require('./Prevision');
const { MedicoPrevision } = require('./MedicoPrevision');
const { Especialidad } = require('./Especialidad');
const { Subespecialidad } = require('./Subespecialidad');
const { MedicoSubespecialidad } = require('./MedicoSubespecialidad');
const { SecretariaMedico } = require('./SecretariaMedico');
const { Paciente } = require('./Paciente');
const { Cita } = require('./Cita');
const { AtencionMedica } = require('./AtencionMedica');
const { Receta } = require('./Receta');
const { RecetaItem } = require('./RecetaItem');
const { Medicamento } = require('./Medicamento');
const { AgendaBloqueo } = require('./AgendaBloqueo');

/**
 * Usuario ↔ Perfil médico
 */
User.hasOne(MedicoPerfil, {
  foreignKey: 'usuario_id',
  as: 'perfil',
});

MedicoPerfil.belongsTo(User, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

/**
 * Especialidad ↔ Subespecialidades
 */
Especialidad.hasMany(Subespecialidad, {
  foreignKey: 'especialidad_id',
  as: 'subespecialidades',
});

Subespecialidad.belongsTo(Especialidad, {
  foreignKey: 'especialidad_id',
  as: 'especialidad',
});

/**
 * Perfil médico ↔ Especialidad
 */
MedicoPerfil.belongsTo(Especialidad, {
  foreignKey: 'especialidad_id',
  as: 'especialidad',
});

/**
 * Médico ↔ Subespecialidades
 */
MedicoPerfil.belongsToMany(Subespecialidad, {
  through: MedicoSubespecialidad,
  foreignKey: 'medico_id',
  otherKey: 'subespecialidad_id',
  as: 'subespecialidades',
});

Subespecialidad.belongsToMany(MedicoPerfil, {
  through: MedicoSubespecialidad,
  foreignKey: 'subespecialidad_id',
  otherKey: 'medico_id',
  as: 'medicos',
});

/**
 * Médico ↔ Previsiones
 */
MedicoPerfil.belongsToMany(Prevision, {
  through: MedicoPrevision,
  foreignKey: 'medico_id',
  otherKey: 'prevision_id',
  as: 'previsiones',
});

Prevision.belongsToMany(MedicoPerfil, {
  through: MedicoPrevision,
  foreignKey: 'prevision_id',
  otherKey: 'medico_id',
  as: 'medicos',
});

/**
 * Secretaria ↔ Médicos
 */
User.belongsToMany(User, {
  through: SecretariaMedico,
  foreignKey: 'secretaria_id',
  otherKey: 'medico_id',
  as: 'medicosAsignados',
});

User.belongsToMany(User, {
  through: SecretariaMedico,
  foreignKey: 'medico_id',
  otherKey: 'secretaria_id',
  as: 'secretariasAsignadas',
});

/**
 * Cita ↔ Paciente / Médico / Secretaria
 */
Cita.belongsTo(Paciente, {
  foreignKey: 'paciente_id',
  as: 'paciente',
});

Cita.belongsTo(User, {
  foreignKey: 'medico_id',
  as: 'medico',
});

Cita.belongsTo(User, {
  foreignKey: 'secretaria_id',
  as: 'secretaria',
});

Paciente.hasMany(Cita, {
  foreignKey: 'paciente_id',
  as: 'citas',
});

User.hasMany(Cita, {
  foreignKey: 'medico_id',
  as: 'citasMedico',
});

/**
 * Atención médica ↔ Cita / Paciente / Médico
 */
AtencionMedica.belongsTo(Cita, {
  foreignKey: 'cita_id',
  as: 'cita',
});

AtencionMedica.belongsTo(Paciente, {
  foreignKey: 'paciente_id',
  as: 'paciente',
});

AtencionMedica.belongsTo(User, {
  foreignKey: 'medico_id',
  as: 'medico',
});

Cita.hasOne(AtencionMedica, {
  foreignKey: 'cita_id',
  as: 'atencion',
});

Paciente.hasMany(AtencionMedica, {
  foreignKey: 'paciente_id',
  as: 'atenciones',
});

User.hasMany(AtencionMedica, {
  foreignKey: 'medico_id',
  as: 'atencionesMedico',
});

/**
 * Receta ↔ Atención médica / Paciente / Médico / Items
 */
AtencionMedica.hasOne(Receta, {
  foreignKey: 'atencion_id',
  as: 'receta',
});

Receta.belongsTo(AtencionMedica, {
  foreignKey: 'atencion_id',
  as: 'atencion',
});

Receta.belongsTo(Paciente, {
  foreignKey: 'paciente_id',
  as: 'paciente',
});

Receta.belongsTo(User, {
  foreignKey: 'medico_id',
  as: 'medico',
});

Receta.hasMany(RecetaItem, {
  foreignKey: 'receta_id',
  as: 'items',
});

RecetaItem.belongsTo(Receta, {
  foreignKey: 'receta_id',
  as: 'receta',
});

/**
 * AgendaBloqueo ↔ Médico
 */
User.hasMany(AgendaBloqueo, {
  foreignKey: 'medico_id',
  as: 'agendaBloqueos',
});

AgendaBloqueo.belongsTo(User, {
  foreignKey: 'medico_id',
  as: 'medico',
});

/**
 * Verifica la conexión a la base de datos.
 *
 * IMPORTANTE:
 * En Render/TiDB no usamos sequelize.sync({ alter: true }),
 * porque la base de datos ya fue creada/importada manualmente.
 */
const syncDatabase = async () => {
  await sequelize.authenticate();
  console.log('Conexión a base de datos verificada correctamente');
};

module.exports = {
  sequelize,

  User,
  ROLES,

  MedicoPerfil,
  Prevision,
  MedicoPrevision,
  Especialidad,
  Subespecialidad,
  MedicoSubespecialidad,

  SecretariaMedico,

  Paciente,
  Cita,
  AtencionMedica,
  Receta,
  RecetaItem,
  Medicamento,
  AgendaBloqueo,

  syncDatabase,
};