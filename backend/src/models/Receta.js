const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receta = sequelize.define('Receta', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  atencion_id:   { type: DataTypes.INTEGER, allowNull: false, unique: true },
  paciente_id:   { type: DataTypes.INTEGER, allowNull: false },
  medico_id:     { type: DataTypes.INTEGER, allowNull: false },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'recetas',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['atencion_id'], name: 'recetas_atencion_uq' },
    { fields: ['paciente_id'],               name: 'recetas_paciente_idx' },
    { fields: ['medico_id'],                 name: 'recetas_medico_idx' },
  ],
});

module.exports = { Receta };
