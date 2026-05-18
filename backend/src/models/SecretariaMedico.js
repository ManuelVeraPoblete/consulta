const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SecretariaMedico = sequelize.define(
  'SecretariaMedico',
  {
    secretaria_id: { type: DataTypes.INTEGER, allowNull: false },
    medico_id:     { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'secretaria_medico', timestamps: false }
);

module.exports = { SecretariaMedico };
