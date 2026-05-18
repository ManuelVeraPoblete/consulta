const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicoSubespecialidad = sequelize.define(
  'MedicoSubespecialidad',
  {
    medico_id:          { type: DataTypes.INTEGER, allowNull: false },
    subespecialidad_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'medico_subespecialidades', timestamps: false }
);

module.exports = { MedicoSubespecialidad };
