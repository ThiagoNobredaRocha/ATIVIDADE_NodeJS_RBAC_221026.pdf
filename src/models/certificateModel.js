const db = require('../config/db');

const Certificate = {
  /**
   * Emite o certificado da inscrição (se ainda não existir) e retorna seus dados.
   */
  async issueForSubscription(subscriptionId) {
    await db.query(
      `INSERT INTO certificates (subscription_id) VALUES ($1)
       ON CONFLICT (subscription_id) DO NOTHING`,
      [subscriptionId]
    );

    const { rows } = await db.query(
      `SELECT c.id, c.code, c.issued_at, c.subscription_id,
              u.id AS user_id, u.name AS user_name, u.email AS user_email,
              e.id AS event_id, e.title AS event_title, e.date AS event_date, e.location AS event_location
       FROM certificates c
       JOIN subscriptions s ON s.id = c.subscription_id
       JOIN users u  ON u.id = s.user_id
       JOIN events e ON e.id = s.event_id
       WHERE c.subscription_id = $1`,
      [subscriptionId]
    );
    return rows[0];
  },
};

module.exports = Certificate;
