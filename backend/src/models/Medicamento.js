const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medicamento = sequelize.define('Medicamento', {
  id:               { type: DataTypes.INTEGER,     primaryKey: true, autoIncrement: true },
  numero_registro:  { type: DataTypes.STRING(30),  allowNull: false, unique: true },
  nombre:           { type: DataTypes.STRING(300), allowNull: false },
  activo:           { type: DataTypes.BOOLEAN,     defaultValue: true },
}, {
  tableName: 'medicamentos',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['numero_registro'], name: 'med_registro_uq' },
    { fields: ['nombre'],                        name: 'med_nombre_idx' },
  ],
});

module.exports = { Medicamento };
