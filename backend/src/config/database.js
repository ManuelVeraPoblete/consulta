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
 * Si DB_SSL=true, Sequelize enviará la conexión usando TLS.
 */
const shouldUseSsl = parseBoolean(process.env.DB_SSL);

/**
 * Configuración centralizada de Sequelize.
 * Usa variables de entorno para no dejar credenciales dentro del código.
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
     * Configuración específica del driver mysql2 usado por Sequelize.
     * Esta sección soluciona el error:
     * "Connections using insecure transport are prohibited".
     */
    dialectOptions: shouldUseSsl
      ? {
          ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
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