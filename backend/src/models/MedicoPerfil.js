const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicoPerfil = sequelize.define(
  'MedicoPerfil',
  {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },

    // Registro prestador
    numero_registro:           { type: DataTypes.STRING(30),  allowNull: true },
    fecha_registro_prestador:  { type: DataTypes.DATEONLY,    allowNull: true },

    // Títulos y especialidad
    titulo_profesional:   { type: DataTypes.STRING(150), allowNull: true },
    especialidad_id:      { type: DataTypes.INTEGER,     allowNull: true },
    entidad_certificadora:{ type: DataTypes.STRING(150), allowNull: true },
    vigencia_especialidad:{ type: DataTypes.DATEONLY,    allowNull: true },

    // Contacto consulta (para receta)
    direccion_consulta: { type: DataTypes.STRING(200), allowNull: true },
    telefono_consulta:  { type: DataTypes.STRING(20),  allowNull: true },

    // Descripción libre
    descripcion: { type: DataTypes.TEXT, defaultValue: '' },

    // Modalidades
    modalidad_presencial:   { type: DataTypes.BOOLEAN, defaultValue: false },
    modalidad_telemedicina: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Convenios
    acepta_isapre:    { type: DataTypes.BOOLEAN, defaultValue: false },
    acepta_fonasa:    { type: DataTypes.BOOLEAN, defaultValue: false },
    acepta_particular:{ type: DataTypes.BOOLEAN, defaultValue: false },
    valor_particular: { type: DataTypes.INTEGER, defaultValue: null },
  },
  {
    tableName: 'medicos_perfil',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['usuario_id'],      name: 'medicos_perfil_usuario_uq'   },
      { unique: true, fields: ['numero_registro'], name: 'medicos_perfil_registro_uq'  },
    ],
  }
);

module.exports = { MedicoPerfil };
