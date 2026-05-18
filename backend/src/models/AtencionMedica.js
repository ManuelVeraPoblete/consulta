const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AtencionMedica = sequelize.define('AtencionMedica', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cita_id:     { type: DataTypes.INTEGER, allowNull: false },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  medico_id:   { type: DataTypes.INTEGER, allowNull: false },

  // Signos vitales
  presion_sistolica:   { type: DataTypes.INTEGER,      allowNull: true },
  presion_diastolica:  { type: DataTypes.INTEGER,      allowNull: true },
  frecuencia_cardiaca: { type: DataTypes.INTEGER,      allowNull: true },
  temperatura:         { type: DataTypes.DECIMAL(4, 1), allowNull: true },
  peso:                { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  talla:               { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  saturacion_oxigeno:  { type: DataTypes.INTEGER,      allowNull: true },

  // Consulta
  motivo_consulta: { type: DataTypes.TEXT, allowNull: false },
  anamnesis:       { type: DataTypes.TEXT, allowNull: true },
  examen_fisico:   { type: DataTypes.TEXT, allowNull: true },
  diagnostico:     { type: DataTypes.TEXT, allowNull: false },
  cie10:           { type: DataTypes.STRING(10), allowNull: true },
  plan_tratamiento:{ type: DataTypes.TEXT, allowNull: true },
  indicaciones:    { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName:  'atenciones_medicas',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['cita_id'], name: 'atenciones_cita_uq' },
    { fields: ['paciente_id'],           name: 'atenciones_paciente_idx' },
    { fields: ['medico_id'],             name: 'atenciones_medico_idx' },
  ],
});

module.exports = { AtencionMedica };
