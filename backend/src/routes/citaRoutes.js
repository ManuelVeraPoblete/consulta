const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/citaController');

const adminOsec = authorize('admin', 'secretaria');

router.get('/',                authenticate, adminOsec, ctrl.listarCitas);
router.post('/',               authenticate, adminOsec, ctrl.crearCita);
router.patch('/:id/reagendar', authenticate, adminOsec, ctrl.reagendarCita);
router.patch('/:id/cancelar',  authenticate, adminOsec, ctrl.cancelarCita);

module.exports = router;
