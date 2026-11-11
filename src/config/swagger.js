const swaggerUi = require('swagger-ui-express');

const bearer = [{ BearerAuth: [] }];
const idParam = (description) => ({
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
  description,
});
const pageParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Página (inicia em 1)' },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Itens por página' },
];
const json = (schema) => ({ 'application/json': { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const paginated = (item) => ({
  type: 'object',
  properties: { data: { type: 'array', items: ref(item) }, pagination: ref('Pagination') },
});
const err = (description) => ({ description, content: json(ref('Error')) });

const E400 = err('Dados inválidos.');
const E401 = err('Token ausente, inválido ou expirado.');
const E403 = err('Acesso negado para o perfil do usuário.');
const E404 = err('Recurso não encontrado.');
const E409 = err('Conflito (registro duplicado).');

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'API REST - NP2 RBAC',
    version: '2.0.0',
    description:
      'API para gestão de eventos acadêmicos, participantes, inscrições e certificados, ' +
      'com autenticação JWT e controle de acesso baseado em perfis (ADMIN, EDITOR, USER).\n\n' +
      '**Como testar:** faça login em `POST /users/login` (ex.: admin@np2.com / admin123), ' +
      'copie o `token` e clique em **Authorize**.\n\n' +
      '| Endpoint | ADMIN | EDITOR | USER | Público |\n' +
      '|---|---|---|---|---|\n' +
      '| GET /events | ✔ | ✔ | ✔ | ✔ |\n' +
      '| POST /events | ✔ | ✔ | ✖ | ✖ |\n' +
      '| PUT /events/:id | ✔ | ✔ | ✖ | ✖ |\n' +
      '| DELETE /events/:id | ✔ | ✖ | ✖ | ✖ |\n' +
      '| POST /users/register | ✔ | ✔ | ✔ | ✔ |\n' +
      '| GET /users | ✔ | ✔ | ✖ | ✖ |\n' +
      '| PUT/PATCH /users/:id | ✔ | ✔ (apenas perfis USER) | ✔ (apenas o próprio) | ✖ |\n' +
      '| DELETE /users/:id | ✔ | ✖ | ✖ | ✖ |\n' +
      '| POST /subscriptions | ✔ | ✔ | ✔ | ✖ |\n' +
      '| GET /subscriptions | ✔ (todas) | ✔ (todas) | ✔ (as suas) | ✖ |\n' +
      '| GET /certificates/:id | ✔ | ✔ | ✔ (das suas inscrições) | ✖ |',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  tags: [
    { name: 'Usuários', description: 'Cadastro, login e gestão de participantes' },
    { name: 'Eventos', description: 'CRUD de eventos acadêmicos' },
    { name: 'Inscrições', description: 'Inscrição de participantes em eventos' },
    { name: 'Certificados', description: 'Emissão de certificados de participação' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Cole aqui o token JWT obtido em POST /users/login',
      },
    },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' } } },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 25 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'João Silva' },
          email: { type: 'string', example: 'joao@email.com' },
          role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'USER'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Semana de Tecnologia' },
          description: { type: 'string', example: 'Palestras sobre Node.js e Arquitetura' },
          date: { type: 'string', format: 'date-time' },
          location: { type: 'string', example: 'Auditório Principal' },
          created_by: { type: 'integer', example: 1 },
          created_by_name: { type: 'string', example: 'Administrador' },
          subscriptions_count: { type: 'integer', example: 4 },
        },
      },
      EventInput: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Semana de Tecnologia' },
          description: { type: 'string', example: 'Palestras sobre Node.js e Arquitetura' },
          date: { type: 'string', example: '2026-12-01 19:00:00' },
          location: { type: 'string', example: 'Auditório Principal' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 3 },
          user_name: { type: 'string' },
          user_email: { type: 'string' },
          event_id: { type: 'integer', example: 1 },
          event_title: { type: 'string' },
          event_date: { type: 'string', format: 'date-time' },
          event_location: { type: 'string' },
          subscribed_at: { type: 'string', format: 'date-time' },
        },
      },
      Certificate: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          code: { type: 'string', example: 'A1B2C3D4E5F6...' },
          subscription_id: { type: 'integer' },
          participante: { type: 'string' },
          email: { type: 'string' },
          evento: { type: 'string' },
          dataEvento: { type: 'string', format: 'date-time' },
          local: { type: 'string' },
          emitidoEm: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/users/register': {
      post: {
        summary: 'Cadastrar-se no sistema (Público) — o perfil é sempre USER',
        tags: ['Usuários'],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
              name: { type: 'string', example: 'João Silva' },
              email: { type: 'string', example: 'joao@email.com' },
              password: { type: 'string', minLength: 6, example: '123456' },
            },
          }),
        },
        responses: {
          201: { description: 'Usuário cadastrado.', content: json({ type: 'object', properties: { message: { type: 'string' }, user: ref('User') } }) },
          400: E400,
          409: err('E-mail já cadastrado.'),
        },
      },
    },
    '/users/login': {
      post: {
        summary: 'Login (Público) — retorna o token JWT',
        tags: ['Usuários'],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', example: 'admin@np2.com' },
              password: { type: 'string', example: 'admin123' },
            },
          }),
        },
        responses: {
          200: {
            description: 'Login realizado.',
            content: json({ type: 'object', properties: { message: { type: 'string' }, token: { type: 'string' }, user: ref('User') } }),
          },
          400: E400,
          401: err('E-mail ou senha inválidos.'),
        },
      },
    },
    '/users/me': {
      get: {
        summary: 'Dados do usuário autenticado',
        tags: ['Usuários'],
        security: bearer,
        responses: { 200: { description: 'OK', content: json(ref('User')) }, 401: E401 },
      },
    },
    '/users': {
      get: {
        summary: 'Listar usuários (ADMIN, EDITOR)',
        tags: ['Usuários'],
        security: bearer,
        parameters: [
          ...pageParams,
          { name: 'name', in: 'query', schema: { type: 'string' }, description: 'Filtro parcial por nome' },
          { name: 'email', in: 'query', schema: { type: 'string' }, description: 'Filtro parcial por e-mail' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'EDITOR', 'USER'] } },
        ],
        responses: { 200: { description: 'OK', content: json(paginated('User')) }, 401: E401, 403: E403 },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Buscar usuário por ID (ADMIN, EDITOR; USER apenas o próprio)',
        tags: ['Usuários'],
        security: bearer,
        parameters: [idParam('ID do usuário')],
        responses: { 200: { description: 'OK', content: json(ref('User')) }, 401: E401, 403: E403, 404: E404 },
      },
      put: {
        summary: 'Editar usuário — substituição (name e email obrigatórios)',
        description: 'ADMIN: qualquer usuário. EDITOR: apenas perfis USER (e o próprio). USER: apenas o próprio perfil. Somente ADMIN altera `role`.',
        tags: ['Usuários'],
        security: bearer,
        parameters: [idParam('ID do usuário')],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string', example: 'João da Silva' },
              email: { type: 'string', example: 'joao@email.com' },
              password: { type: 'string', example: 'novaSenha123' },
              role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'USER'], description: 'Somente ADMIN' },
            },
          }),
        },
        responses: { 200: { description: 'Atualizado' }, 400: E400, 401: E401, 403: E403, 404: E404, 409: E409 },
      },
      patch: {
        summary: 'Editar usuário — atualização parcial',
        description: 'Mesmas regras de acesso do PUT; envie apenas os campos a alterar.',
        tags: ['Usuários'],
        security: bearer,
        parameters: [idParam('ID do usuário')],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              password: { type: 'string' },
              role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'USER'], description: 'Somente ADMIN' },
            },
          }),
        },
        responses: { 200: { description: 'Atualizado' }, 400: E400, 401: E401, 403: E403, 404: E404, 409: E409 },
      },
      delete: {
        summary: 'Deletar usuário (ADMIN)',
        tags: ['Usuários'],
        security: bearer,
        parameters: [idParam('ID do usuário')],
        responses: { 200: { description: 'Deletado' }, 400: E400, 401: E401, 403: E403, 404: E404 },
      },
    },
    '/events': {
      get: {
        summary: 'Listar eventos (Público) — com filtros e paginação',
        tags: ['Eventos'],
        parameters: [
          ...pageParams,
          { name: 'title', in: 'query', schema: { type: 'string' }, description: 'Filtro parcial por título' },
          { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Filtro parcial por local' },
          { name: 'from', in: 'query', schema: { type: 'string', example: '2026-12-01' }, description: 'Eventos a partir desta data' },
          { name: 'to', in: 'query', schema: { type: 'string', example: '2026-12-31' }, description: 'Eventos até esta data' },
        ],
        responses: { 200: { description: 'OK', content: json(paginated('Event')) }, 400: E400 },
      },
      post: {
        summary: 'Criar evento (ADMIN, EDITOR)',
        tags: ['Eventos'],
        security: bearer,
        requestBody: { required: true, content: json({ ...ref('EventInput') }) },
        responses: { 201: { description: 'Criado' }, 400: E400, 401: E401, 403: E403 },
      },
    },
    '/events/{id}': {
      get: {
        summary: 'Buscar evento por ID (Público)',
        tags: ['Eventos'],
        parameters: [idParam('ID do evento')],
        responses: { 200: { description: 'OK', content: json(ref('Event')) }, 404: E404 },
      },
      put: {
        summary: 'Editar evento (ADMIN, EDITOR)',
        description: 'Campos não enviados mantêm o valor atual.',
        tags: ['Eventos'],
        security: bearer,
        parameters: [idParam('ID do evento')],
        requestBody: { required: true, content: json(ref('EventInput')) },
        responses: { 200: { description: 'Atualizado' }, 400: E400, 401: E401, 403: E403, 404: E404 },
      },
      delete: {
        summary: 'Deletar evento (ADMIN)',
        tags: ['Eventos'],
        security: bearer,
        parameters: [idParam('ID do evento')],
        responses: { 200: { description: 'Deletado' }, 401: E401, 403: E403, 404: E404 },
      },
    },
    '/subscriptions': {
      post: {
        summary: 'Inscrever-se em um evento (ADMIN, EDITOR, USER)',
        tags: ['Inscrições'],
        security: bearer,
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['event_id'], properties: { event_id: { type: 'integer', example: 1 } } }),
        },
        responses: { 201: { description: 'Inscrição realizada' }, 400: E400, 401: E401, 404: E404, 409: err('Já inscrito neste evento.') },
      },
      get: {
        summary: 'Listar inscrições (ADMIN/EDITOR: todas; USER: apenas as suas)',
        tags: ['Inscrições'],
        security: bearer,
        parameters: [
          ...pageParams,
          { name: 'event_id', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por evento' },
          { name: 'user_id', in: 'query', schema: { type: 'integer' }, description: 'Filtrar por usuário (ignorado para USER)' },
        ],
        responses: { 200: { description: 'OK', content: json(paginated('Subscription')) }, 400: E400, 401: E401 },
      },
    },
    '/certificates/{id}': {
      get: {
        summary: 'Emitir / Baixar certificado (ADMIN, EDITOR; USER apenas das suas inscrições)',
        description: 'O `id` é o **ID da inscrição**. O certificado é emitido na primeira consulta. Use `?format=txt` para baixar como arquivo.',
        tags: ['Certificados'],
        security: bearer,
        parameters: [
          idParam('ID da inscrição'),
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'txt'] }, description: 'txt = download do certificado' },
        ],
        responses: {
          200: {
            description: 'Certificado emitido',
            content: {
              ...json({ type: 'object', properties: { message: { type: 'string' }, certificate: ref('Certificate') } }),
              'text/plain': { schema: { type: 'string' } },
            },
          },
          401: E401,
          403: err('Tentativa de acessar certificado de outro usuário.'),
          404: E404,
        },
      },
    },
  },
};

module.exports = { swaggerUi, swaggerDocument };
