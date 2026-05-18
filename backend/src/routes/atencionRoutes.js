const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/atencionController');

const soloMedico = authorize('medico', 'admin');

router.post('/',                          authenticate, soloMedico, ctrl.crearAtencion);
router.get('/cita/:citaId',               authenticate, authorize('medico','secretaria','admin'), ctrl.getAtencionByCita);
router.get('/paciente/:pacienteId',       authenticate, authorize('medico','secretaria','admin'), ctrl.getHistorialPaciente);
router.get('/:atencionId/receta',         authenticate, authorize('medico','secretaria','admin'), ctrl.getRecetaByAtencion);

module.exports = router;
