/**
 * Cria as tabelas (database.sql) e insere dados iniciais (seed).
 * Uso: npm run db:init
 * É idempotente: pode ser executado várias vezes sem duplicar dados.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool } = require('./src/config/db');

// Usuários de teste (um por perfil) — apenas para desenvolvimento/apresentação
const SEED_USERS = [
  { name: 'Administrador', email: 'admin@np2.com', password: 'admin123', role: 'ADMIN' },
  { name: 'Editor', email: 'editor@np2.com', password: 'editor123', role: 'EDITOR' },
  { name: 'Usuário Comum', email: 'user@np2.com', password: 'user123', role: 'USER' },
];

const SEED_EVENTS = [
  {
    title: 'Semana de Tecnologia',
    description: 'Palestras sobre Node.js, APIs REST e Arquitetura de Software',
    date: '2026-12-01 19:00:00',
    location: 'Auditório Principal',
  },
  {
    title: 'Workshop de PostgreSQL',
    description: 'Modelagem de dados e otimização de consultas',
    date: '2026-12-10 14:00:00',
    location: 'Laboratório 3',
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDatabase(retries = 15) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`Aguardando PostgreSQL (${attempt}/${retries})... ${err.message}`);
      await sleep(2000);
    }
  }
  throw new Error('Não foi possível conectar ao PostgreSQL.');
}

async function main() {
  await waitForDatabase();

  const schema = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Tabelas criadas/verificadas.');

  for (const user of SEED_USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [user.name, user.email, hash, user.role]
    );
  }
  console.log('✅ Usuários de teste garantidos (admin/editor/user @np2.com).');

  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM events');
  if (rows[0].total === 0) {
    const admin = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@np2.com']);
    for (const ev of SEED_EVENTS) {
      await pool.query(
        'INSERT INTO events (title, description, date, location, created_by) VALUES ($1, $2, $3, $4, $5)',
        [ev.title, ev.description, ev.date, ev.location, admin.rows[0].id]
      );
    }
    console.log('✅ Eventos de exemplo inseridos.');
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error('❌ Erro ao inicializar o banco:', err.message);
    await pool.end();
    process.exit(1);
  });
