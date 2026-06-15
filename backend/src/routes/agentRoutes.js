const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { agentAdmin }     = require('../controllers/agentAdminController');
const { agentSecretaria } = require('../controllers/agentSecretariaController');
const { agentMedico }    = require('../controllers/agentMedicoController');
const { agentPaciente }  = require('../controllers/agentPacienteController');

const router = Router();

router.post('/admin',     authenticate, authorize('admin'),     agentAdmin);
router.post('/secretary', authenticate, authorize('secretaria'), agentSecretaria);
router.post('/medico',    authenticate, authorize('medico'),    agentMedico);
router.post('/patient',   authenticate, authorize('paciente'),  agentPaciente);

module.exports = router;
