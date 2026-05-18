const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subespecialidad = sequelize.define(
  'Subespecialidad',
  {
    id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    especialidad_id: { type: DataTypes.INTEGER, allowNull: false },
    nombre:          { type: DataTypes.STRING(100), allowNull: false },
    activo:          { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'subespecialidades',
    timestamps: false,
  }
);

module.exports = { Subespecialidad };
