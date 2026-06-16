const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrdenExamen = sequelize.define('OrdenExamen', {
  id:                      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  atencion_id:             { type: DataTypes.INTEGER, allowNull: true },
  cita_id:                 { type: DataTypes.INTEGER, allowNull: true },
  paciente_id:             { type: DataTypes.INTEGER, allowNull: false },
  medico_id:               { type: DataTypes.INTEGER, allowNull: false },
  diagnostico_presuntivo:  { type: DataTypes.TEXT,    allowNull: true },
  instrucciones_generales: { type: DataTypes.TEXT,    allowNull: true },
  urgencia: {
    type: DataTypes.ENUM('rutina', 'urgente', 'muy_urgente'),
    allowNull: false,
    defaultValue: 'rutina',
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'realizado', 'cancelado'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
}, {
  tableName: 'ordenes_examen',
  timestamps: true,
  indexes: [
    { fields: ['paciente_id'], name: 'ordenes_paciente_idx'  },
    { fields: ['medico_id'],   name: 'ordenes_medico_idx'    },
    { fields: ['cita_id'],     name: 'ordenes_cita_idx'      },
    { fields: ['atencion_id'], name: 'ordenes_atencion_idx'  },
  ],
});

module.exports = { OrdenExamen };
