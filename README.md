# Professional Service Hub

A Node.js/Express application that provides a service marketplace backend with authentication, service listings, bookings, messages, and reviews. The application also serves a simple frontend from the `public/` directory.

## Features

- JWT-based authentication
- Rate limited auth and API routes
- PostgreSQL database support via `pg`
- Frontend served from `public/`
- Automatic database setup via `setup-db.js`

## Requirements

- Node.js 18+ (or compatible)
- PostgreSQL database
- `npm`

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
DATABASE_URL=postgres://user:password@host:port/dbname
JWT_SECRET=your_jwt_secret
PORT=5000
```

If using individual connection settings:

```env
DB_HOST=localhost
DB_USER=your_db_user
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Available Scripts

- `npm start` - Start the server with Node
- `npm run dev` - Start the server with `nodemon`
- `npm run setup-db` - Initialize or migrate the database schema

## Running the App

```bash
npm start
```

Then open `http://localhost:5000` in your browser.

## API Overview

The server mounts the following route groups:

- `POST /api/auth/*` - Authentication endpoints
- `GET /api/services/*` - Service listings and management
- `GET /api/bookings/*` - Booking actions
- `GET /api/messages/*` - Messaging endpoints
- `GET /api/reviews/*` - Reviews and ratings

## Utility Endpoints

- `GET /test-db` - Verify database connectivity
- `GET /protected` - Example protected route requiring a valid JWT
- `GET /debug/routes` - List registered routes

## Notes

- The app writes runtime logs to `server.log`.
- Static frontend assets are served from `public/`.
- The app auto-creates missing tables on startup via `setup-db.js`.

## Production checklist

- Use `NODE_ENV=production` and secure deployment configuration.
- Protect `JWT_SECRET` and other secrets with secure storage.
- Restrict CORS using `ALLOWED_ORIGINS` instead of allowing all origins.
- Run the app behind HTTPS or a trusted reverse proxy.
- Use a managed or production-grade PostgreSQL database.
- Do not commit `.env` to source control.
- Add database migrations and CI before launching.

## Docker setup

This repository includes a `Dockerfile` and `docker-compose.yml` for local production-like startup.

```bash
docker compose up --build
```

The compose setup defines:
- `db` as PostgreSQL 16
- `app` running on port `5000`
