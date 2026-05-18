const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:      { type: DataTypes.STRING(100), allowNull: false },
  apellido:    { type: DataTypes.STRING(100), allowNull: false },
  rut:         { type: DataTypes.STRING(20),  allowNull: true  },
  fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
  genero:      { type: DataTypes.ENUM('masculino','femenino','otro'), allowNull: false },
  telefono:    { type: DataTypes.STRING(25),  allowNull: true },
  email:       { type: DataTypes.STRING(150), allowNull: true },
  direccion:   { type: DataTypes.STRING(200), allowNull: true },
  ciudad:      { type: DataTypes.STRING(100), allowNull: true },
  // Previsión salud
  prevision_salud:  { type: DataTypes.ENUM('fonasa','isapre','particular'), allowNull: false, defaultValue: 'fonasa' },
  nombre_isapre:    { type: DataTypes.STRING(100), allowNull: true },
  numero_fonasa:    { type: DataTypes.STRING(50),  allowNull: true },
  // Previsión social
  prevision_social: { type: DataTypes.ENUM('afp','ips','ninguna'), allowNull: false, defaultValue: 'ninguna' },
  nombre_afp:       { type: DataTypes.STRING(100), allowNull: true },
  // Datos clínicos
  grupo_sanguineo:  { type: DataTypes.ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','desconocido'), allowNull: false, defaultValue: 'desconocido' },
  alergias:         { type: DataTypes.TEXT, allowNull: true },
  antecedentes:     { type: DataTypes.TEXT, allowNull: true },
  // Contacto emergencia
  contacto_emergencia_nombre:   { type: DataTypes.STRING(150), allowNull: true },
  contacto_emergencia_telefono: { type: DataTypes.STRING(25),  allowNull: true },
  // Estado
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName:  'pacientes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['rut'], name: 'pacientes_rut_uq', where: { rut: { [require('sequelize').Op.ne]: null } } },
  ],
});

module.exports = { Paciente };
