// backend/src/config/database.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Convierte variables de entorno tipo string a boolean.
 * Render guarda todas las variables como texto.
 */
const parseBoolean = (value) => {
  return String(value).toLowerCase() === 'true';
};

/**
 * TiDB Cloud exige conexión segura mediante SSL/TLS.
 * DB_SSL=true activa la conexión cifrada.
 */
const shouldUseSsl = parseBoolean(process.env.DB_SSL);

/**
 * Configuración centralizada de Sequelize.
 * Todas las credenciales vienen desde variables de entorno.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    dialect: 'mysql',
    logging: false,

    /**
     * Render no tiene el certificado CA de TiDB como archivo local.
     * Por eso usamos SSL cifrado sin validación estricta del certificado.
     */
    dialectOptions: shouldUseSsl
      ? {
          ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: false,
          },
        }
      : {},

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;