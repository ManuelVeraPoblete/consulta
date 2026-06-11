const { verifyToken } = require('../services/authService');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const user = await User.findByPk(payload.id, { attributes: ['id', 'email', 'rol', 'activo'] });
    if (!user || !user.activo) {
      return res.status(401).json({ message: 'Cuenta desactivada o no encontrada' });
    }

    req.user = { id: user.id, email: user.email, rol: user.rol };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
