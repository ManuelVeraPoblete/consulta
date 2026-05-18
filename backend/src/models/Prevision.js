const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prevision = sequelize.define(
  'Prevision',
  {
    id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    tipo:   { type: DataTypes.ENUM('fonasa', 'isapre'), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'previsiones',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['nombre'], name: 'previsiones_nombre_uq' },
    ],
  }
);

module.exports = { Prevision };
