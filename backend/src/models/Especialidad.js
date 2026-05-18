const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Especialidad = sequelize.define(
  'Especialidad',
  {
    id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'especialidades',
    timestamps: false,
    indexes: [{ unique: true, fields: ['nombre'], name: 'especialidades_nombre_uq' }],
  }
);

module.exports = { Especialidad };
