# Professional Service Hub

A Node.js/Express application that provides a service marketplace backend with authentication, service listings, bookings, messages, and reviews. The application also serves a simple frontend from the `public/` directory.

## Features

- JWT-based authentication
- Rate limited auth and API routes
- PostgreSQL database support via `pg`
- Frontend served from `public/`
- Automatic database setup via migrations

## Requirements

- Node.js 18+ (or compatible)
- PostgreSQL database
- `npm`
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:

```bash
git clone <repo-url>
cd servicehub
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with the required environment variables.

### Required environment variables

If using `DATABASE_URL` for a single connection string:

```env
DATABASE_URL=postgres://user:password@host:5432/dbname
JWT_SECRET=your_jwt_secret
PORT=5000
ALLOWED_ORIGINS=https://your-production-domain.com
NODE_ENV=production
```

If using individual connection settings:

```env
DB_HOST=localhost
DB_USER=your_db_user
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
PORT=5000
ALLOWED_ORIGINS=https://your-production-domain.com
NODE_ENV=production
```

## Database Setup

Run migrations to set up the database schema:

```bash
npm run migrate
```

To check migration status:

```bash
npm run migrate:status
```

To rollback the last migration:

```bash
npm run migrate:down
```

## Available Scripts

- `npm start` - Start the server with Node
- `npm run dev` - Start the server with `nodemon`
- `npm run build` - Install dependencies
- `npm run migrate` - Run database migrations
- `npm run migrate:status` - Check migration status
- `npm run migrate:down` - Rollback last migration
- `npm run setup-db` - Alias for migrate (deprecated)
- `npm test` - Run the test suite
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues

## Running the App

### Local Development

```bash
npm run dev
```

Then open `http://localhost:5000` in your browser.

### Production

```bash
npm start
```

## Deployment

### Docker Deployment

This repository includes a `Dockerfile` and `docker-compose.yml` for containerized deployment.

#### Using Docker Compose (Recommended)

1. Ensure Docker and Docker Compose are installed.

2. Build and run the application:

```bash
docker compose up --build
```

This starts:
- PostgreSQL database on port 5432
- Node.js application on port 5000

3. Access the application at `http://localhost:5000`.

4. To stop:

```bash
docker compose down
```

#### Manual Docker Build

```bash
docker build -t servicehub .
docker run -p 5000:5000 --env-file .env servicehub
```

### Production Deployment

1. Set up a PostgreSQL database (e.g., AWS RDS, Google Cloud SQL, or self-hosted).

2. Configure environment variables securely (use secrets management like AWS Secrets Manager or environment variables).

3. Deploy the application:
   - Use a platform like Heroku, Vercel, Railway, or AWS ECS.
   - Or deploy to a VPS with PM2 or systemd.

4. Set up a reverse proxy (e.g., Nginx) for HTTPS and load balancing.

5. Run migrations on deployment:

```bash
npm run migrate
```

6. Start the application:

```bash
npm start
```

## Operation

### Starting the Application

- **Development**: `npm run dev`
- **Production**: `npm start`
- **Docker**: `docker compose up`

### Monitoring

- Health check: `GET /health` returns JSON with status, uptime, and timestamp.
- Database check: `GET /test-db` verifies database connectivity.
- Logs: Check `server.log` for application logs.

### User Management

- Register users via `POST /api/auth/register`
- Login via `POST /api/auth/login`
- Get user profile via `GET /api/auth/me` (authenticated)

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - List all users (for messaging)

#### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create a service (providers only)
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service (owner only)
- `DELETE /api/services/:id` - Delete service (owner only)

#### Bookings
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create a booking
- `PATCH /api/bookings/:id/status` - Update booking status

#### Messages
- `GET /api/messages` - Get user's messages
- `POST /api/messages` - Send a message
- `GET /api/messages/:id` - Get message details
- `DELETE /api/messages/:id` - Delete message

#### Reviews
- `POST /api/reviews` - Add a review
- `GET /api/reviews/provider/:providerId` - Get provider reviews
- `GET /api/reviews/me` - Get user's reviews

### Utility Endpoints

- `GET /health` - Basic health check
- `GET /test-db` - Verify database connectivity
- `GET /protected` - Example protected route requiring a valid JWT
- `GET /debug/routes` - List registered routes

## Testing

Run the test suite:

```bash
npm test
```

## Linting

Run ESLint to check code quality:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

## GitHub Actions CI

A GitHub Actions workflow is included at `.github/workflows/nodejs.yml` to:

- install dependencies
- start PostgreSQL
- run database migrations
- run linting
- execute the Jest test suite

## Production checklist

- Use `NODE_ENV=production` and secure deployment configuration.
- Protect `JWT_SECRET` and other secrets with secure storage.
- Restrict CORS using `ALLOWED_ORIGINS` instead of allowing all origins.
- Run the app behind HTTPS or a trusted reverse proxy.
- Use a managed or production-grade PostgreSQL database.
- Do not commit `.env` to source control.
- Add database migrations and CI before launching.
- Add automated tests and run them in CI.
- Run linting to maintain code quality.

## Docker setup

This repository includes a `Dockerfile` and `docker-compose.yml` for local production-like startup.

```bash
docker compose up --build
```

The compose setup defines:
- `db` as PostgreSQL 16
- `app` running on port `5000`

## Notes

- The app writes runtime logs to `server.log`.
- Static frontend assets are served from `public/`.
- Database schema is now managed by migrations, not automatic startup schema creation.

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure PostgreSQL is running and accessible.
   - Check `.env` variables for correct database credentials.
   - Run `npm run migrate` to set up the database.

2. **Server won't start**
   - Check for missing environment variables.
   - Ensure port 5000 is not in use.
   - Check `server.log` for error details.

3. **Tests failing**
   - Ensure database is set up: `npm run migrate`
   - Check that PostgreSQL is running on port 5432.

4. **CORS errors**
   - Set `ALLOWED_ORIGINS` to your frontend domain.
   - For development, set to `http://localhost:5000`.

5. **Migration issues**
   - Check migration status: `npm run migrate:status`
   - Rollback if needed: `npm run migrate:down`

### Logs

- Application logs: `server.log`
- Test output: Run `npm test` for details
- Docker logs: `docker compose logs`

### Support

For issues, check the logs and ensure all environment variables are set correctly. The application includes health checks to verify system status.
