const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrdenExamenItem = sequelize.define('OrdenExamenItem', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orden_id:      { type: DataTypes.INTEGER, allowNull: false },
  tipo: {
    type: DataTypes.ENUM('laboratorio', 'imagen', 'electrocardiograma', 'otro'),
    allowNull: false,
    defaultValue: 'laboratorio',
  },
  nombre_examen: { type: DataTypes.STRING(200), allowNull: false },
  codigo:        { type: DataTypes.STRING(50),  allowNull: true },
  instrucciones: { type: DataTypes.TEXT,        allowNull: true },
}, {
  tableName: 'orden_examen_items',
  timestamps: false,
  indexes: [{ fields: ['orden_id'], name: 'orden_items_orden_idx' }],
});

module.exports = { OrdenExamenItem };
