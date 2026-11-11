require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('❌ Variável de ambiente JWT_SECRET não definida. Configure o arquivo .env.');
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Documentação Swagger disponível em http://localhost:${PORT}/docs`);
});
