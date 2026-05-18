const { Router } = require('express');
const { buscarMedicos, getEspecialidades, getDashboard, getMisCitas, getMisPacientes } = require('../controllers/medicoController');
const { getEstadoMes, crearRegistro, eliminarRegistro, verificarDisponibilidad } = require('../controllers/agendaController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = Router();

router.get('/especialidades', authenticate, getEspecialidades);
router.get('/buscar',         authenticate, buscarMedicos);
router.get('/dashboard', authenticate, authorize('medico', 'admin'), getDashboard);
router.get('/citas',     authenticate, authorize('medico', 'admin'), getMisCitas);
router.get('/pacientes', authenticate, authorize('medico', 'admin'), getMisPacientes);

// Agenda – administración de bloqueos (solo médico)
router.get('/agenda/estado',        authenticate, authorize('medico', 'admin'), getEstadoMes);
router.post('/agenda/registro',     authenticate, authorize('medico', 'admin'), crearRegistro);
router.delete('/agenda/registro/:id', authenticate, authorize('medico', 'admin'), eliminarRegistro);

// Agenda – consulta de disponibilidad (accesible a secretaria)
router.get('/agenda/disponibilidad', authenticate, verificarDisponibilidad);

module.exports = router;
