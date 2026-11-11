const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const { getPagination, paginatedResponse } = require('../utils/pagination');
const { ROLES } = require('../middlewares/rbacMiddleware');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

function validateEmail(email) {
  if (!EMAIL_REGEX.test(email)) throw new AppError('E-mail em formato inválido.', 400);
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw new AppError(`A senha deve ter no mínimo ${MIN_PASSWORD} caracteres.`, 400);
  }
}

/**
 * Regras RBAC para editar um usuário (PUT/PATCH /users/:id):
 *  - ADMIN:  pode editar qualquer usuário (inclusive o perfil/role).
 *  - EDITOR: pode editar apenas usuários com perfil USER (e o próprio perfil).
 *  - USER:   pode editar apenas o próprio perfil.
 *  - Somente ADMIN pode alterar o campo "role".
 */
function assertCanEdit(currentUser, target, body) {
  const isSelf = currentUser.id === target.id;

  if (currentUser.role === ROLES.USER && !isSelf) {
    throw new AppError('Acesso negado. Você só pode editar o seu próprio perfil.', 403);
  }
  if (currentUser.role === ROLES.EDITOR && !isSelf && target.role !== ROLES.USER) {
    throw new AppError('Acesso negado. Editores só podem editar perfis do tipo USER.', 403);
  }
  if (body.role !== undefined && currentUser.role !== ROLES.ADMIN) {
    throw new AppError('Acesso negado. Apenas ADMIN pode alterar o perfil (role) de um usuário.', 403);
  }
}

const userController = {
  /** POST /users/register — público. Todo novo cadastro recebe o perfil USER. */
  async register(req, res) {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      throw new AppError('Nome, e-mail e senha são obrigatórios.', 400);
    }
    validateEmail(email);
    validatePassword(password);

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ name, email, password: hashedPassword, role: ROLES.USER });
      return res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user });
    } catch (err) {
      if (err.code === '23505') throw new AppError('E-mail já cadastrado.', 409);
      throw err;
    }
  },

  /** POST /users/login — público. Retorna o JWT. */
  async login(req, res) {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new AppError('E-mail e senha são obrigatórios.', 400);
    }

    const user = await User.findByEmailWithPassword(email);
    const match = user && (await bcrypt.compare(password, user.password));
    if (!match) {
      throw new AppError('E-mail ou senha inválidos.', 401);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  },

  /** GET /users/me — usuário autenticado. */
  async me(req, res) {
    const user = await User.findById(req.user.id);
    return res.json(user);
  },

  /** GET /users — ADMIN e EDITOR. Filtros: name, email, role. Paginação: page, limit. */
  async list(req, res) {
    const { page, limit, offset } = getPagination(req.query);
    const { name, email, role } = req.query;

    const { rows, total } = await User.findAll({ name, email, role, limit, offset });
    return res.json(paginatedResponse(rows, total, page, limit));
  },

  /** GET /users/:id — ADMIN/EDITOR qualquer usuário; USER apenas o próprio. */
  async getById(req, res) {
    const id = Number(req.params.id);

    if (req.user.role === ROLES.USER && req.user.id !== id) {
      throw new AppError('Acesso negado. Você só pode visualizar o seu próprio perfil.', 403);
    }

    const user = await User.findById(id);
    if (!user) throw new AppError('Usuário não encontrado.', 404);
    return res.json(user);
  },

  /** PUT (substituição: name e email obrigatórios) e PATCH (parcial) /users/:id */
  async update(req, res) {
    const id = Number(req.params.id);
    const body = req.body || {};
    const isPut = req.method === 'PUT';

    const target = await User.findById(id);
    if (!target) throw new AppError('Usuário não encontrado.', 404);

    assertCanEdit(req.user, target, body);

    if (isPut && (!body.name || !body.email)) {
      throw new AppError('No PUT, os campos name e email são obrigatórios. Use PATCH para atualização parcial.', 400);
    }

    const fields = {};
    if (body.name !== undefined) {
      if (!String(body.name).trim()) throw new AppError('O nome não pode ser vazio.', 400);
      fields.name = body.name;
    }
    if (body.email !== undefined) {
      validateEmail(body.email);
      fields.email = body.email;
    }
    if (body.password !== undefined) {
      validatePassword(body.password);
      fields.password = await bcrypt.hash(body.password, 10);
    }
    if (body.role !== undefined) {
      const role = String(body.role).toUpperCase();
      if (!Object.values(ROLES).includes(role)) {
        throw new AppError('Perfil inválido. Use ADMIN, EDITOR ou USER.', 400);
      }
      fields.role = role;
    }

    if (Object.keys(fields).length === 0) {
      throw new AppError('Informe ao menos um campo para atualizar (name, email, password, role).', 400);
    }

    try {
      const user = await User.update(id, fields);
      return res.json({ message: 'Usuário atualizado com sucesso!', user });
    } catch (err) {
      if (err.code === '23505') throw new AppError('E-mail já cadastrado.', 409);
      throw err;
    }
  },

  /** DELETE /users/:id — apenas ADMIN. */
  async remove(req, res) {
    const id = Number(req.params.id);

    if (req.user.id === id) {
      throw new AppError('Você não pode excluir a sua própria conta de administrador.', 400);
    }

    const deleted = await User.remove(id);
    if (!deleted) throw new AppError('Usuário não encontrado.', 404);
    return res.json({ message: 'Usuário deletado com sucesso!' });
  },
};

module.exports = userController;
