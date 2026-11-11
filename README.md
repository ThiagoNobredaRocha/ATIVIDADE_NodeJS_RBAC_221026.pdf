# NP2 RBAC — API de Gestão de Eventos Acadêmicos

API REST em **Node.js + Express + PostgreSQL** para gerenciar eventos, participantes, inscrições e certificados,
com autenticação **JWT** e controle de acesso por perfis (**RBAC**: ADMIN, EDITOR, USER).

## Tecnologias

- Node.js 18+ / Express 5
- PostgreSQL 16 (driver `pg`)
- JWT (`jsonwebtoken`) + `bcrypt` para senhas
- Swagger / OpenAPI 3 (`swagger-ui-express`)
- Docker / Docker Compose
- Coleção Postman (`postman/`)

## Estrutura em camadas

```
src/
├── app.js                 # Configuração do Express (rotas, Swagger, erros)
├── server.js              # Inicialização do servidor
├── config/                # Conexão com o banco (db.js) e documentação (swagger.js)
├── routes/                # Definição dos endpoints + middlewares de acesso
├── controllers/           # Regras de negócio, validações e regras RBAC por recurso
├── models/                # Acesso a dados (SQL parametrizado)
├── middlewares/           # JWT (auth), RBAC (checkRole), validação de :id, tratamento de erros
└── utils/                 # AppError, paginação, montagem de filtros
database.sql               # Script SQL (DDL) do banco
init-db.js                 # Cria as tabelas e insere dados de teste (seed)
postman/                   # Coleção Postman com testes
```

## Como executar

### Opção 1 — Tudo com Docker

```bash
docker compose up --build
```

A API sobe em `http://localhost:3000` (o banco é criado e populado automaticamente).

### Opção 2 — API local + PostgreSQL no Docker

```bash
npm install
cp .env.example .env
docker compose up -d db
npm run db:init
npm run dev
```

> Se tiver um PostgreSQL instalado localmente, crie o banco `np2_rbac` e ajuste `DATABASE_URL` no `.env`.

### Documentação

- Swagger UI: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/docs.json

### Usuários de teste (criados pelo `init-db.js`)

| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | admin@np2.com | admin123 |
| EDITOR | editor@np2.com | editor123 |
| USER | user@np2.com | user123 |

> Por segurança, `POST /users/register` sempre cria usuários com perfil **USER**. Apenas um ADMIN pode promover
> um usuário (via `PUT/PATCH /users/:id` com o campo `role`).

## Matriz de permissões (RBAC)

| Funcionalidade | Endpoint | ADMIN | EDITOR | USER | Público |
|---|---|:-:|:-:|:-:|:-:|
| Listar / Buscar eventos | `GET /events`, `GET /events/:id` | ✔ | ✔ | ✔ | ✔ |
| Criar evento | `POST /events` | ✔ | ✔ | ✖ | ✖ |
| Editar evento | `PUT /events/:id` | ✔ | ✔ | ✖ | ✖ |
| Deletar evento | `DELETE /events/:id` | ✔ | ✖ | ✖ | ✖ |
| Cadastrar-se | `POST /users/register` | ✔ | ✔ | ✔ | ✔ |
| Listar usuários | `GET /users` | ✔ | ✔ | ✖ | ✖ |
| Editar usuário | `PUT/PATCH /users/:id` | ✔ | ✔ (apenas perfis USER) | ✔ (apenas o próprio) | ✖ |
| Deletar usuário | `DELETE /users/:id` | ✔ | ✖ | ✖ | ✖ |
| Inscrever-se em evento | `POST /subscriptions` | ✔ | ✔ | ✔ | ✖ |
| Listar inscrições | `GET /subscriptions` | ✔ (todas) | ✔ (todas) | ✔ (as suas) | ✖ |
| Emitir / Baixar certificado | `GET /certificates/:id` | ✔ | ✔ | ✔ (das suas inscrições) | ✖ |

Respostas: **401** sem token / token inválido; **403** perfil sem permissão.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/users/register` | Cadastro (público) |
| POST | `/users/login` | Login → token JWT |
| GET | `/users/me` | Perfil do usuário autenticado |
| GET | `/users` | Lista usuários (filtros `name`, `email`, `role`) |
| GET | `/users/:id` | Busca usuário |
| PUT / PATCH | `/users/:id` | Edita usuário (PUT exige `name` e `email`; PATCH é parcial) |
| DELETE | `/users/:id` | Remove usuário |
| GET | `/events` | Lista eventos (filtros `title`, `location`, `from`, `to`) |
| GET | `/events/:id` | Busca evento |
| POST | `/events` | Cria evento |
| PUT | `/events/:id` | Edita evento |
| DELETE | `/events/:id` | Remove evento |
| POST | `/subscriptions` | Inscreve o usuário autenticado (`{ "event_id": 1 }`) |
| GET | `/subscriptions` | Lista inscrições (filtros `event_id`, `user_id`) |
| GET | `/certificates/:id` | Emite certificado da inscrição `:id` (`?format=txt` para download) |
| GET | `/health` | Status da API e do banco |

### Paginação

Todas as listagens aceitam `?page=1&limit=10` (máx. 100) e retornam:

```json
{
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
}
```

### Tratamento de erros

Todos os erros retornam JSON no formato `{ "error": "mensagem" }` com o status HTTP adequado
(400 validação, 401 autenticação, 403 permissão, 404 não encontrado, 409 duplicidade, 500 erro interno).

## Testes com Postman

Importe `postman/NP2-RBAC.postman_collection.json` no Postman e execute a coleção pelo **Runner**
(a pasta "0. Autenticação" salva automaticamente os tokens de cada perfil).

Via linha de comando:

```bash
npx newman run postman/NP2-RBAC.postman_collection.json
```
# ATIVIDADE_NodeJS_RBAC_221026.pdf
