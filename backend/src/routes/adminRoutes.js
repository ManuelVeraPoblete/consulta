const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  listarUsuarios,
  crearMedico,
  crearSecretaria,
  crearUsuario,
  getUsuario,
  actualizarUsuario,
  actualizarMedicosSecretaria,
  desactivarUsuario,
  reactivarUsuario,
  listarPrevisiones,
  listarEspecialidades,
} = require('../controllers/adminController');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/especialidades', listarEspecialidades);
router.get('/previsiones', listarPrevisiones);
router.get('/usuarios', listarUsuarios);
router.post('/medicos',     crearMedico);
router.post('/secretarias', crearSecretaria);
router.put('/secretarias/:id/medicos', actualizarMedicosSecretaria);
router.post('/usuarios', crearUsuario);
router.get('/usuarios/:id', getUsuario);
router.put('/usuarios/:id', actualizarUsuario);
router.patch('/usuarios/:id/desactivar', desactivarUsuario);
router.patch('/usuarios/:id/reactivar', reactivarUsuario);

module.exports = router;
