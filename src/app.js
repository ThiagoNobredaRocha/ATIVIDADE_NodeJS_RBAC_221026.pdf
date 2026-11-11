const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const { swaggerUi, swaggerDocument } = require('./config/swagger');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/docs.json', (req, res) => res.json(swaggerDocument));

app.get('/', (req, res) => {
  res.json({ message: 'API NP2-RBAC rodando com sucesso! Acesse a documentação em /docs' });
});

app.get('/health', async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok', database: 'up' });
});

app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/certificates', certificateRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
