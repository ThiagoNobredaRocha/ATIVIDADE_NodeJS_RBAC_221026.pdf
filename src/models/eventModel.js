const db = require('../config/db');
const { buildWhere } = require('../utils/queryBuilder');

const SELECT_EVENT = `
  SELECT e.id, e.title, e.description, e.date, e.location,
         e.created_by, u.name AS created_by_name,
         (SELECT COUNT(*)::int FROM subscriptions s WHERE s.event_id = e.id) AS subscriptions_count,
         e.created_at, e.updated_at
  FROM events e
  LEFT JOIN users u ON u.id = e.created_by
`;

const Event = {
  async create({ title, description, date, location, created_by }) {
    const { rows } = await db.query(
      `INSERT INTO events (title, description, date, location, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, date, location, created_by]
    );
    return rows[0];
  },

  async findAll({ title, location, from, to, limit, offset }) {
    const { where, params } = buildWhere([
      ['e.title ILIKE ?', title && `%${title}%`],
      ['e.location ILIKE ?', location && `%${location}%`],
      ['e.date >= ?', from],
      ['e.date <= ?', to],
    ]);

    const count = await db.query(`SELECT COUNT(*)::int AS total FROM events e ${where}`, params);
    const { rows } = await db.query(
      `${SELECT_EVENT} ${where}
       ORDER BY e.date ASC, e.id ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { rows, total: count.rows[0].total };
  },

  async findById(id) {
    const { rows } = await db.query(`${SELECT_EVENT} WHERE e.id = $1`, [id]);
    return rows[0];
  },

  async update(id, { title, description, date, location }) {
    const { rows } = await db.query(
      `UPDATE events SET title = $1, description = $2, date = $3, location = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, description, date, location, id]
    );
    return rows[0];
  },

  async remove(id) {
    const { rowCount } = await db.query('DELETE FROM events WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = Event;
