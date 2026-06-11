const { verifyToken } = require('../services/authService');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  const cookieToken = req.cookies?.authToken;
  const authHeader  = req.headers.authorization;
  const token       = cookieToken ?? (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  try {
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
