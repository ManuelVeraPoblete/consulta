const authService = require('../services/authService');
const { User, MedicoPerfil, Especialidad } = require('../models');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IS_PROD  = process.env.NODE_ENV === 'production';

// Derivamos el maxAge del mismo JWT_EXPIRES_IN para que cookie y token sean coherentes
function parseExpiryMs(s = '2h') {
  const m = String(s).match(/^(\d+)([smhd])$/);
  if (!m) return 2 * 3600 * 1000;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(m[1]) * units[m[2]];
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: IS_PROD ? 'strict' : 'lax',
  path:     '/',
  maxAge:   parseExpiryMs(process.env.JWT_EXPIRES_IN),
};

const setAuthCookie = (res, token) => res.cookie('authToken', token, COOKIE_OPTS);

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    const { token, user } = await authService.login(email, password);
    setAuthCookie(res, token);
    res.json({ user, message: 'Login exitoso' });
  } catch {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
};

const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body;
    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    const { token, user } = await authService.register({ nombre, apellido, email, password, rol });
    setAuthCookie(res, token);
    res.status(201).json({ user, message: 'Usuario registrado exitosamente' });
  } catch (error) {
    const msg = error.message === 'El correo ya está registrado' || error.message === 'Registro no permitido para este rol'
      ? error.message
      : 'Error al registrar usuario';
    res.status(400).json({ message: msg });
  }
};

const logout = (req, res) => {
  res.clearCookie('authToken', { path: '/' });
  res.json({ message: 'Sesión cerrada' });
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

module.exports = { login, register, getProfile, logout };
