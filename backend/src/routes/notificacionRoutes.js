const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificacionController');

const router = Router();
const auth = [authenticate];
const staffOnly = [authenticate, authorize('admin', 'medico', 'secretaria')];

router.get('/destinatarios',    ...staffOnly, ctrl.getDestinatarios);
router.post('/enviar',          ...staffOnly, ctrl.enviarNotificacion);
router.get('/mis-notificaciones', ...auth,   ctrl.getMisNotificaciones);
router.get('/no-leidas/count',    ...auth,   ctrl.contarNoLeidas);
router.patch('/leer-todas',       ...auth,   ctrl.marcarTodasLeidas);
router.patch('/:id/leer',         ...auth,   ctrl.marcarLeida);

module.exports = router;
