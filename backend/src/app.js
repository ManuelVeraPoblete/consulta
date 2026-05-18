require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./models');
const authRoutes      = require('./routes/authRoutes');
const medicoRoutes    = require('./routes/medicoRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const pacienteRoutes     = require('./routes/pacienteRoutes');
const secretariaRoutes   = require('./routes/secretariaRoutes');
const citaRoutes         = require('./routes/citaRoutes');
const atencionRoutes       = require('./routes/atencionRoutes');
const medicamentoRoutes    = require('./routes/medicamentoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      authRoutes);
app.use('/api/medicos',   medicoRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/pacientes',   pacienteRoutes);
app.use('/api/secretaria',  secretariaRoutes);
app.use('/api/citas',       citaRoutes);
app.use('/api/atenciones',    atencionRoutes);
app.use('/api/medicamentos',  medicamentoRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

syncDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar con la base de datos:', err);
    process.exit(1);
  });
