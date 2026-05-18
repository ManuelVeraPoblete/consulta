const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecetaItem = sequelize.define('RecetaItem', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  receta_id:    { type: DataTypes.INTEGER, allowNull: false },
  medicamento:  { type: DataTypes.STRING(200), allowNull: false },
  dosis:        { type: DataTypes.STRING(100), allowNull: true },
  frecuencia:   { type: DataTypes.STRING(100), allowNull: true },
  duracion:     { type: DataTypes.STRING(100), allowNull: true },
  indicaciones: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'receta_items',
  timestamps: false,
  indexes: [{ fields: ['receta_id'], name: 'receta_items_receta_idx' }],
});

module.exports = { RecetaItem };
