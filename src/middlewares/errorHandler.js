const AppError = require('../utils/AppError');

/**
 * 404 para rotas inexistentes.
 */
const notFound = (req, res, next) => {
  next(new AppError(`Rota não encontrada: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Tratamento centralizado de erros (Express 5 encaminha erros de funções async automaticamente).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // JSON malformado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }

  // Erros do PostgreSQL
  switch (err.code) {
    case '23505':
      return res.status(409).json({ error: 'Registro duplicado.', detail: err.detail });
    case '23503':
      return res.status(400).json({ error: 'Referência inválida (registro relacionado não existe).' });
    case '23514':
      return res.status(400).json({ error: 'Valor não permitido para um dos campos.' });
    case '22P02':
    case '22007':
    case '22008':
      return res.status(400).json({ error: 'Dado em formato inválido.' });
    case 'ECONNREFUSED':
      return res.status(503).json({ error: 'Banco de dados indisponível.' });
    default:
      break;
  }

  console.error(err);
  return res.status(500).json({ error: 'Erro interno no servidor.' });
};

module.exports = { notFound, errorHandler };
