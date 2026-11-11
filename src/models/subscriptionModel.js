const db = require('../config/db');
const { buildWhere } = require('../utils/queryBuilder');

const Subscription = {
  async create(user_id, event_id) {
    const { rows } = await db.query(
      'INSERT INTO subscriptions (user_id, event_id) VALUES ($1, $2) RETURNING *',
      [user_id, event_id]
    );
    return rows[0];
  },

  /** Lista inscrições. Se userId for informado, retorna apenas as desse usuário. */
  async findAll({ userId, eventId, limit, offset }) {
    const { where, params } = buildWhere([
      ['s.user_id = ?', userId],
      ['s.event_id = ?', eventId],
    ]);

    const count = await db.query(`SELECT COUNT(*)::int AS total FROM subscriptions s ${where}`, params);
    const { rows } = await db.query(
      `SELECT s.id, s.user_id, u.name AS user_name, u.email AS user_email,
              s.event_id, e.title AS event_title, e.date AS event_date, e.location AS event_location,
              s.subscribed_at
       FROM subscriptions s
       JOIN users u  ON u.id = s.user_id
       JOIN events e ON e.id = s.event_id
       ${where}
       ORDER BY s.id
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { rows, total: count.rows[0].total };
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    return rows[0];
  },
};

module.exports = Subscription;
