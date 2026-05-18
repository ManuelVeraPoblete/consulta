const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicoPrevision = sequelize.define(
  'MedicoPrevision',
  {
    medico_id:    { type: DataTypes.INTEGER, allowNull: false },
    prevision_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'medico_previsiones', timestamps: false }
);

module.exports = { MedicoPrevision };
