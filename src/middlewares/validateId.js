const AppError = require('../utils/AppError');

/**
 * Garante que :id seja um inteiro positivo.
 */
const validateId = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return next(new AppError('O parâmetro :id deve ser um número inteiro positivo.', 400));
  }
  return next();
};

module.exports = validateId;
