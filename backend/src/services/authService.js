const jwt = require('jsonwebtoken');
const { User, MedicoPerfil, Especialidad } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const withPerfil = (id) =>
  User.findByPk(id, {
    include: [{
      model: MedicoPerfil,
      as: 'perfil',
      required: false,
      include: [{ model: Especialidad, as: 'especialidad' }],
    }],
  });

const login = async (email, password) => {
  const raw = await User.findOne({ where: { email, activo: true } });
  if (!raw) throw new Error('Credenciales inválidas');

  const valid = await raw.validatePassword(password);
  if (!valid) throw new Error('Credenciales inválidas');

  const token = generateToken(raw);
  const user  = await withPerfil(raw.id);
  return { token, user };
};

const register = async ({ nombre, apellido, email, password, rol }) => {
  const exists = await User.findOne({ where: { email } });
  if (exists) throw new Error('El correo ya está registrado');

  const user = await User.create({ nombre, apellido, email, password, rol });
  const token = generateToken(user);
  return { token, user };
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { login, register, verifyToken };
