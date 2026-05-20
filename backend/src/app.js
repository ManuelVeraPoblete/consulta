// backend/src/app.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { syncDatabase } = require('./models');

const authRoutes = require('./routes/authRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const secretariaRoutes = require('./routes/secretariaRoutes');
const citaRoutes = require('./routes/citaRoutes');
const atencionRoutes = require('./routes/atencionRoutes');
const medicamentoRoutes = require('./routes/medicamentoRoutes');

const app = express();

/**
 * Render entrega el puerto mediante process.env.PORT.
 * En local usa 5000 por defecto.
 */
const PORT = process.env.PORT || 5000;

/**
 * Origen permitido para el frontend.
 * Por ahora puede ser localhost; luego lo cambiaremos por la URL real del frontend.
 */
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Rutas principales de la API.
 */
app.use('/api/auth', authRoutes);
app.use('/api/medicos', medicoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/secretaria', secretariaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/atenciones', atencionRoutes);
app.use('/api/medicamentos', medicamentoRoutes);

/**
 * Endpoint simple para probar si el backend está vivo.
 */
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'consulta-medica-api',
    timestamp: new Date(),
  });
});

/**
 * Manejo de rutas inexistentes.
 */
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

/**
 * Manejo centralizado de errores.
 */
app.use((err, req, res, next) => {
  console.error('Error interno:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

/**
 * Logs de seguridad para errores que podrían cerrar el proceso.
 */
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT_EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED_REJECTION:', reason);
  process.exit(1);
});

/**
 * Primero prueba la conexión/sincronización con la BD.
 * Si funciona, recién ahí levanta el servidor.
 */
syncDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`CORS habilitado para: ${corsOrigin}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar con la base de datos:');
    console.error(err);
    console.error('Detalle del error:', {
      name: err?.name,
      message: err?.message,
      parentMessage: err?.parent?.sqlMessage,
      code: err?.parent?.code,
      errno: err?.parent?.errno,
      sqlState: err?.parent?.sqlState,
    });

    process.exit(1);
  });