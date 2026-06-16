const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/ordenController');

const router = Router();
const medico = [authenticate, authorize('medico')];

router.post('/',                         ...medico, ctrl.crearOrden);
router.get('/mis-ordenes',               ...medico, ctrl.getMisOrdenes);
router.get('/cita/:citaId',              ...medico, ctrl.getOrdenByCita);
router.get('/paciente/:pacienteId',      ...medico, ctrl.getOrdenesPaciente);
router.patch('/:id/estado',              ...medico, ctrl.actualizarEstado);

module.exports = router;
