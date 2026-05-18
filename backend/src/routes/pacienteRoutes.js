const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/pacienteController');

const adminOsec = authorize('admin', 'secretaria');

router.get('/',           authenticate, adminOsec, ctrl.listarPacientes);
router.get('/:id',        authenticate, adminOsec, ctrl.obtenerPaciente);
router.post('/',          authenticate, adminOsec, ctrl.crearPaciente);
router.put('/:id',        authenticate, adminOsec, ctrl.actualizarPaciente);
router.patch('/:id/off',  authenticate, adminOsec, ctrl.desactivarPaciente);
router.patch('/:id/on',   authenticate, adminOsec, ctrl.reactivarPaciente);

module.exports = router;
