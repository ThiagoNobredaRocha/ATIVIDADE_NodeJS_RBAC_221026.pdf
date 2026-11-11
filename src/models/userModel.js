const db = require('../config/db');
const { buildWhere } = require('../utils/queryBuilder');

const PUBLIC_FIELDS = 'id, name, email, role, created_at, updated_at';

const User = {
  async create({ name, email, password, role = 'USER' }) {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING ${PUBLIC_FIELDS}`,
      [name, email, password, role]
    );
    return rows[0];
  },

  /** Retorna o usuário COM o hash da senha (uso exclusivo do login). */
  async findByEmailWithPassword(email) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await db.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1`, [id]);
    return rows[0];
  },

  async findAll({ name, email, role, limit, offset }) {
    const { where, params } = buildWhere([
      ['name ILIKE ?', name && `%${name}%`],
      ['email ILIKE ?', email && `%${email}%`],
      ['role = ?', role && role.toUpperCase()],
    ]);

    const count = await db.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, params);
    const { rows } = await db.query(
      `SELECT ${PUBLIC_FIELDS} FROM users ${where}
       ORDER BY id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { rows, total: count.rows[0].total };
  },

  /** Atualiza apenas os campos informados (name, email, password, role). */
  async update(id, fields) {
    const allowed = ['name', 'email', 'password', 'role'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    params.push(id);

    const { rows } = await db.query(
      `UPDATE users SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING ${PUBLIC_FIELDS}`,
      params
    );
    return rows[0];
  },

  async remove(id) {
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = User;
