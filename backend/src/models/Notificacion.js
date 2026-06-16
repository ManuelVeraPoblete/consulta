const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  emisor_id:   { type: DataTypes.INTEGER, allowNull: false },
  receptor_id: { type: DataTypes.INTEGER, allowNull: false },
  titulo:      { type: DataTypes.STRING(200), allowNull: false },
  mensaje:     { type: DataTypes.TEXT, allowNull: false },
  leida:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'notificaciones',
  timestamps: true,
  indexes: [
    { fields: ['receptor_id'],        name: 'notif_receptor_idx'      },
    { fields: ['emisor_id'],          name: 'notif_emisor_idx'        },
    { fields: ['receptor_id', 'leida'], name: 'notif_receptor_leida_idx' },
  ],
});

module.exports = { Notificacion };
