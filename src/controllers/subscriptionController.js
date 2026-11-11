const Subscription = require('../models/subscriptionModel');
const Event = require('../models/eventModel');
const AppError = require('../utils/AppError');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { ROLES } = require('../middlewares/rbacMiddleware');

const subscriptionController = {
  /** POST /subscriptions — ADMIN, EDITOR e USER (o usuário autenticado se inscreve). */
  async create(req, res) {
    const eventId = Number((req.body || {}).event_id);

    if (!Number.isInteger(eventId) || eventId < 1) {
      throw new AppError('O campo event_id é obrigatório e deve ser um número inteiro.', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) throw new AppError('Evento não encontrado.', 404);

    try {
      const subscription = await Subscription.create(req.user.id, eventId);
      return res.status(201).json({ message: 'Inscrição realizada com sucesso!', subscription });
    } catch (err) {
      if (err.code === '23505') throw new AppError('Você já está inscrito neste evento.', 409);
      throw err;
    }
  },

  /**
   * GET /subscriptions — ADMIN e EDITOR veem todas; USER vê apenas as suas.
   * Filtros: event_id (todos), user_id (ADMIN/EDITOR). Paginação: page, limit.
   */
  async list(req, res) {
    const { page, limit, offset } = getPagination(req.query);
    const canSeeAll = req.user.role === ROLES.ADMIN || req.user.role === ROLES.EDITOR;

    const userId = canSeeAll ? req.query.user_id : req.user.id;
    const eventId = req.query.event_id;

    if (userId !== undefined && !Number.isInteger(Number(userId))) {
      throw new AppError('O filtro user_id deve ser um número inteiro.', 400);
    }
    if (eventId !== undefined && !Number.isInteger(Number(eventId))) {
      throw new AppError('O filtro event_id deve ser um número inteiro.', 400);
    }

    const { rows, total } = await Subscription.findAll({ userId, eventId, limit, offset });
    return res.json(paginatedResponse(rows, total, page, limit));
  },
};

module.exports = subscriptionController;
