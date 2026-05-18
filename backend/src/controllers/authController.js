const authService = require('../services/authService');
const { User, MedicoPerfil, Especialidad } = require('../models');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    const { token, user } = await authService.login(email, password);
    res.json({ token, user, message: 'Login exitoso' });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body;
    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    const { token, user } = await authService.register({ nombre, apellido, email, password, rol });
    res.status(201).json({ token, user, message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: MedicoPerfil,
        as: 'perfil',
        required: false,
        include: [{ model: Especialidad, as: 'especialidad' }],
      }],
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { login, register, getProfile };
