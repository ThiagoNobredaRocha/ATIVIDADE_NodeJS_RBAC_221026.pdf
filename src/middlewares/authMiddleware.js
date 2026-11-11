const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

/**
 * Valida o JWT (Authorization: Bearer <token>) e carrega o usuário atual do banco,
 * garantindo que o perfil (role) usado nas verificações RBAC esteja sempre atualizado.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  const [scheme, token] = authHeader.split(' ');
  if (!token || !/^Bearer$/i.test(scheme)) {
    throw new AppError('Token mal formatado. Use: Bearer <token>.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Token inválido ou expirado.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Usuário do token não existe mais.', 401);
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  return next();
};

module.exports = verifyToken;
