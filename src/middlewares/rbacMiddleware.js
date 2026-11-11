const AppError = require('../utils/AppError');

const ROLES = Object.freeze({ ADMIN: 'ADMIN', EDITOR: 'EDITOR', USER: 'USER' });

/**
 * Permite o acesso apenas aos perfis informados. Deve ser usado após verifyToken.
 */
const checkRole = (allowedRoles) => (req, res, next) => {
  const userRole = req.user && req.user.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return next(new AppError('Acesso negado. Você não tem permissão para realizar esta operação.', 403));
  }

  return next();
};

module.exports = checkRole;
module.exports.ROLES = ROLES;
