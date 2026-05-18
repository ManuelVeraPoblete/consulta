const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AgendaBloqueo = sequelize.define('AgendaBloqueo', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  medico_id:    { type: DataTypes.INTEGER, allowNull: false },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin:    { type: DataTypes.DATEONLY, allowNull: false },
  tipo: {
    type: DataTypes.ENUM('bloqueo', 'liberacion'),
    allowNull: false,
  },
  motivo: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'agenda_bloqueos',
  timestamps: true,
  indexes: [
    { fields: ['medico_id', 'fecha_inicio', 'fecha_fin'], name: 'agenda_bloqueos_medico_fechas_idx' },
  ],
});

module.exports = { AgendaBloqueo };
