/**
 * Erro de aplicação com status HTTP — tratado pelo middleware errorHandler.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
