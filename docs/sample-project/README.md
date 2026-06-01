# TaskFlow API

TaskFlow is a modern REST API for task and team project management. Designed to be simple, fast, and secure, it allows developers to integrate task management into any application.

## Key Features

- **Task Management** — Complete CRUD with priorities, due dates, tags, and statuses
- **Projects** — Organize tasks in projects with members and permissions
- **Collaboration** — Assign tasks, comment, and receive real-time notifications
- **Webhooks** — Integrate TaskFlow with any external system
- **Official SDKs** — JavaScript/TypeScript and Python available
- **Rate Limiting** — 100 requests/minute per authenticated user
- **Cursor-based Pagination** — Efficient handling of large collections

## Tech Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Express 4.x
- **Database:** PostgreSQL 15 (with pg_vector extension for semantic search)
- **Cache:** Redis 7
- **Auth:** JWT (RS256) + Refresh tokens
- **Docs:** OpenAPI 3.1 (auto-generated)
- **Testing:** Jest + Supertest
- **CI/CD:** GitHub Actions

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 15
- Redis >= 7
- npm >= 10

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/taskflow/api.git
cd api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.template .env
```

Edit `.env` with your values (see Environment Variables section below).

### 4. Initialize the database

```bash
# Create the database
createdb taskflow_dev

# Run migrations
npm run db:migrate

# (Optional) Load sample data
npm run db:seed
```

### 5. Start in development mode

```bash
npm run dev
```

The server will be available at `http://localhost:3000`.

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# PostgreSQL database
DATABASE_URL=postgresql://user:password@localhost:5432/taskflow_dev

# Redis (cache and sessions)
REDIS_URL=redis://localhost:6379

# JWT
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Email (for notifications)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@taskflow.app

# Webhooks
WEBHOOK_SECRET=your-secret-here

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Project Structure

```
taskflow-api/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express configuration
│   ├── routes/
│   │   ├── auth.ts           # Authentication routes
│   │   ├── tasks.ts          # Tasks CRUD
│   │   ├── projects.ts       # Projects CRUD
│   │   └── users.ts          # User management
│   ├── controllers/
│   │   ├── tasks.controller.ts
│   │   ├── projects.controller.ts
│   │   └── users.controller.ts
│   ├── services/
│   │   ├── auth.service.ts   # JWT logic
│   │   ├── tasks.service.ts  # Task business rules
│   │   └── email.service.ts  # Email sending
│   ├── models/
│   │   ├── task.ts
│   │   ├── project.ts
│   │   └── user.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT validation
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   ├── db/
│   │   ├── client.ts         # PostgreSQL client
│   │   └── migrations/       # Migration SQL files
│   └── utils/
│       ├── pagination.ts
│       └── validators.ts
├── tests/
├── docs/
├── .env.template
└── package.json
```

## Running in Production

```bash
# Build TypeScript
npm run build

# Run migrations in production
npm run db:migrate:prod

# Start server
npm start
```

We recommend using PM2 or a similar process manager:

```bash
npm install -g pm2
pm2 start dist/index.js --name taskflow-api
pm2 startup
pm2 save
```

## Available Scripts

| Script               | Description                               |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Start in development mode with hot-reload |
| `npm run build`      | Compile TypeScript to JavaScript          |
| `npm start`          | Start the compiled server                 |
| `npm test`           | Run all tests                             |
| `npm run test:watch` | Run tests in watch mode                   |
| `npm run db:migrate` | Apply pending migrations                  |
| `npm run db:seed`    | Load sample data                          |
| `npm run db:reset`   | Reset the database (development only)     |
| `npm run lint`       | Lint code with ESLint                     |
| `npm run typecheck`  | Check types without compiling             |

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make atomic commits with descriptive messages
4. Ensure tests pass: `npm test`
5. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before contributing.

## Support

- **Documentation:** https://docs.taskflow.app
- **Issues:** https://github.com/taskflow/api/issues
- **Discord:** https://discord.gg/taskflow
- **Email:** support@taskflow.app

## License

MIT — see [LICENSE](./LICENSE) for details.
