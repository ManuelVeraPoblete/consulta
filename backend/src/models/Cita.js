const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cita = sequelize.define('Cita', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id:   { type: DataTypes.INTEGER, allowNull: false },
  medico_id:     { type: DataTypes.INTEGER, allowNull: false },
  secretaria_id: { type: DataTypes.INTEGER, allowNull: true },
  fecha_hora:    { type: DataTypes.DATE,    allowNull: false },
  duracion_min:  { type: DataTypes.INTEGER, defaultValue: 30 },
  motivo:        { type: DataTypes.TEXT,    allowNull: true },
  estado: {
    type: DataTypes.ENUM('programada', 'confirmada', 'cancelada', 'completada'),
    defaultValue: 'programada',
  },
  notas: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'citas',
  timestamps: true,
  indexes: [
    { fields: ['medico_id', 'fecha_hora'], name: 'citas_medico_fecha_idx' },
    { fields: ['paciente_id'],             name: 'citas_paciente_idx' },
  ],
});

module.exports = { Cita };
