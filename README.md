# Disqueue — Distributed Job Queue API

Disqueue is a backend project built with **Node.js, Express, and Redis** to explore asynchronous job processing, queue management, and distributed worker architecture.

The project is being developed incrementally, with a focus on backend fundamentals, API design, authentication, and reliable job processing.

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express.js** — HTTP API
- **Redis** — Queue storage and job metadata
- **Docker** — Local Redis environment
- **JWT** — Token-based authentication
- **bcrypt** — Password hashing

## Features

### Job Management

- Submit jobs through a REST API.
- Generate a unique identifier for each job.
- Store job metadata in Redis.
- Retrieve job status using a job ID.
- Process queued jobs through a separate worker.

### Authentication

- User registration with password hashing using bcrypt.
- Login with password verification.
- JWT issuance after successful registration or login.
- Bearer-token authentication middleware for protected endpoints.
- Token signature and expiration verification.
- Validation of missing or malformed authorization headers.
- Consistent authentication errors for invalid credentials.

> Authentication currently uses an in-memory user store. Registered users are lost when the API process restarts. Persistent user storage is planned for a later stage.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/register` | Register a user |
| `POST` | `/login` | Authenticate a user and obtain a JWT |
| `POST` | `/jobs` | Submit a job (authenticated) |
| `GET` | `/jobs/:id` | Retrieve job metadata |

### Register

**Request:** `POST /register`

```json
{
  "username": "demo",
  "password": "your-password"
}
```

A successful registration returns a JWT.

### Login

**Request:** `POST /login`

```json
{
  "username": "demo",
  "password": "your-password"
}
```

A successful login returns a JWT. Invalid credentials return `401 Unauthorized`.

### Submit a Job

**Request:** `POST /jobs`

Include the token in the request header:

```http
Authorization: Bearer <your-jwt>
Content-Type: application/json
```

Example body:

```json
{
  "title": "Example job"
}
```

The API validates the request, creates a job identifier, stores its metadata in Redis, and queues the job. A successfully accepted job returns `202 Accepted`.

### Retrieve Job Status

**Request:** `GET /jobs/:id`

Use the job ID returned when submitting the job to retrieve its stored metadata and status.

## Authentication and Error Handling

Protected endpoints validate the `Authorization` header before executing their route handlers.

Expected behavior:

| Scenario | Expected response |
|---|---|
| Missing authorization header | `401 Unauthorized` |
| Missing or malformed Bearer token | `401 Unauthorized` |
| Invalid token signature | `401 Unauthorized` |
| Expired token | `401 Unauthorized` |
| Missing registration/login fields | `400 Bad Request` |
| Username already exists | `409 Conflict` |
| Invalid login credentials | `401 Unauthorized` |
| Unexpected server error | `500 Internal Server Error` |

The middleware must reject malformed headers, including headers with missing tokens or extra parts, rather than accepting an ambiguous token format.

JWTs are signed, not inherently encrypted. Sensitive information must not be placed in their payload. The JWT signing secret must be supplied through an environment variable and must never be committed to version control.

## Running Locally

### Prerequisites

- Node.js and npm
- Docker
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Ayush0090-BD/Disqueue-managment-API.git
cd Disqueue-managment-API
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Redis

If you already have the `queue-redis` container:

```bash
docker start queue-redis
```

To verify Redis is running:

```bash
docker exec -it queue-redis redis-cli ping
```

Expected output:

```text
PONG
```

If you don't have the container yet, create one:

```bash
docker run -d --name queue-redis -p 6379:6379 redis
```

### 4. Configure environment variables

Create a local `.env` file:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_a_long_random_secret
```

Use a securely generated secret in practice. Ensure `.env` is listed in `.gitignore`.

### 5. Start the API and worker

Run the API using the start command configured in `package.json`. For example, if `index.js` is the entry point:

```bash
node index.js
```

In a separate terminal, start the worker using the configured worker entry point:

```bash
node src/worker.js
```

Adjust these commands if your `package.json` defines different scripts or paths.

## Current Limitations

- User accounts are stored in memory rather than a persistent database.
- Queue reliability and recovery after worker crashes require further development.
- Production-grade retries, dead-letter queues, and visibility timeouts are not yet guaranteed.
- Automated test coverage for authentication and job processing is still to be established.

## Planned Improvements

- Persistent user storage using PostgreSQL.
- Stronger automated tests for authentication and malformed requests.
- Reliable job recovery after worker failures.
- Retry policies with exponential backoff.
- Dead-letter queue support.
- Idempotent job submission.
- Improved logging, metrics, and observability.
- Docker-based integration testing.

## Project Goal

The goal of Disqueue is to build a practical understanding of backend engineering concepts: API design, authentication, Redis data structures, asynchronous processing, failure handling, and distributed systems.

This is an evolving learning project. Features listed as implemented should be verified against the current code before being treated as production-ready.
