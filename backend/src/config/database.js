// backend/src/config/database.js

const fs = require('fs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const parseBoolean = (value) => String(value).toLowerCase() === 'true';

const shouldUseSsl = parseBoolean(process.env.DB_SSL);

const buildSslOptions = () => {
  if (!shouldUseSsl) return {};

  const sslOpts = { minVersion: 'TLSv1.2' };

  if (process.env.DB_SSL_CA) {
    // Validación completa del certificado cuando se provee la CA (recomendado en producción).
    sslOpts.ca = fs.readFileSync(process.env.DB_SSL_CA);
    sslOpts.rejectUnauthorized = true;
  } else {
    // Sin CA local (limitación de Render con TiDB Cloud). El tráfico viaja cifrado
    // pero sin verificar la identidad del servidor. Aceptable en Render porque la
    // conexión no cruza redes públicas arbitrarias. Agregar DB_SSL_CA para máxima seguridad.
    sslOpts.rejectUnauthorized = false;
  }

  return { ssl: sslOpts };
};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    dialect: 'mysql',
    logging: false,
    dialectOptions: buildSslOptions(),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;