const Event = require('../models/eventModel');
const AppError = require('../utils/AppError');
const { getPagination, paginatedResponse } = require('../utils/pagination');

function validateDate(value, field = 'date') {
  if (Number.isNaN(Date.parse(value))) {
    throw new AppError(`O campo ${field} deve ser uma data válida (ex.: 2026-12-01 19:00:00).`, 400);
  }
}

const eventController = {
  /** GET /events — público. Filtros: title, location, from, to. Paginação: page, limit. */
  async list(req, res) {
    const { page, limit, offset } = getPagination(req.query);
    const { title, location, from, to } = req.query;

    if (from) validateDate(from, 'from');
    if (to) validateDate(to, 'to');

    const { rows, total } = await Event.findAll({ title, location, from, to, limit, offset });
    return res.json(paginatedResponse(rows, total, page, limit));
  },

  /** GET /events/:id — público. */
  async getById(req, res) {
    const event = await Event.findById(Number(req.params.id));
    if (!event) throw new AppError('Evento não encontrado.', 404);
    return res.json(event);
  },

  /** POST /events — ADMIN e EDITOR. */
  async create(req, res) {
    const { title, description, date, location } = req.body || {};

    if (!title || !date) {
      throw new AppError('Título e data do evento são obrigatórios.', 400);
    }
    validateDate(date);

    const event = await Event.create({
      title,
      description,
      date,
      location,
      created_by: req.user.id,
    });
    return res.status(201).json({ message: 'Evento criado com sucesso!', event });
  },

  /** PUT /events/:id — ADMIN e EDITOR. Campos não enviados mantêm o valor atual. */
  async update(req, res) {
    const id = Number(req.params.id);
    const body = req.body || {};

    const current = await Event.findById(id);
    if (!current) throw new AppError('Evento não encontrado.', 404);

    if (body.title !== undefined && !String(body.title).trim()) {
      throw new AppError('O título não pode ser vazio.', 400);
    }
    if (body.date !== undefined) validateDate(body.date);

    const event = await Event.update(id, {
      title: body.title ?? current.title,
      description: body.description ?? current.description,
      date: body.date ?? current.date,
      location: body.location ?? current.location,
    });
    return res.json({ message: 'Evento atualizado com sucesso!', event });
  },

  /** DELETE /events/:id — apenas ADMIN. */
  async remove(req, res) {
    const deleted = await Event.remove(Number(req.params.id));
    if (!deleted) throw new AppError('Evento não encontrado.', 404);
    return res.json({ message: 'Evento deletado com sucesso!' });
  },
};

module.exports = eventController;
