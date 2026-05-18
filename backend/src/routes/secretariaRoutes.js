const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/secretariaController');

router.get('/stats',       authenticate, authorize('secretaria', 'admin'), ctrl.getDashboardStats);
router.get('/mis-medicos', authenticate, authorize('secretaria', 'admin'), ctrl.misMedicos);
router.get('/atenciones',     authenticate, authorize('secretaria', 'admin'), ctrl.getAtenciones);
router.get('/informe-diario', authenticate, authorize('secretaria', 'admin'), ctrl.getInformeDiario);

module.exports = router;
