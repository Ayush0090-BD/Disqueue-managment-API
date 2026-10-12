# Distributed Job Processing System

A backend project exploring asynchronous job processing using Node.js, Express, and Redis. The goal is to build a queue-based system that separates job submission from job execution and progressively introduces reliability, concurrency, and failure recovery.

> **Project status:** Early development — Redis-backed job producer implemented and tested.

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express.js** — REST API
- **Redis** — Queue storage
- **Docker** — Redis development environment

## Current Features

- `POST /jobs` endpoint for submitting jobs.
- Request validation to reject missing, non-string, or empty titles.
- Unique job IDs generated using UUIDs.
- Job metadata containing an ID, title, status, and creation timestamp.
- JSON serialization before storing jobs in Redis.
- HTTP `202 Accepted` response when a job is successfully enqueued.
- Basic error handling for Redis write failures.
- Verified job availability after restarting the Node.js server while Redis remains running.

## Architecture

```text
Client
  |
  | POST /jobs
  v
Express API
  |
  | Validate request
  | Generate job ID
  | Serialize job
  v
Redis List: jobs
```

The API currently acts as a **producer**: it accepts jobs and places them in a Redis list. Job execution by independent workers has not yet been implemented.

## API Reference

### `POST /jobs`

Submits a job to the queue.

**Request**

```http
POST /jobs
Content-Type: application/json
```

```json
{
  "title": "Generate report"
}
```

**Successful response — `202 Accepted`**

```json
{
  "id": "61f64594-83cd-4853-b69b-bdfe5fe4f3d4",
  "title": "Generate report",
  "status": "queued",
  "createdat": "2026-10-12T17:33:54.803Z"
}
```

The ID and timestamp above are illustrative examples.

**Validation failure — `400 Bad Request`**

Returned when `title` is missing, is not a string, or contains only whitespace.

**Redis write failure — `500 Internal Server Error`**

Returned when the API cannot successfully enqueue the job.

## Run Locally

### Prerequisites

- Node.js and npm
- Docker

### 1. Clone the repository

```bash
git clone <https://github.com/Ayush0090-BD/Disqueue-managment-API>
cd <repository-directory>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Redis

```bash
docker run -d \
  --name queue-redis \
  -p 6379:6379 \
  redis
```

If you already have a container named `queue-redis`, start that existing container instead:

```bash
docker start queue-redis
```

### 4. Start the API

```bash
node src/server.js
```

The API listens on port `3000`, and the Redis client connects to `localhost:6379`.

### 5. Submit a job

Using curl:

```bash
curl -i -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Generate report"}'
```

### 6. Inspect queued jobs

```bash
docker exec -it queue-redis redis-cli LRANGE jobs 0 -1
```

This displays the serialized jobs stored in the Redis list.

## Roadmap

- [x] Build the initial Express API.
- [x] Connect the API to Redis.
- [x] Validate job submissions and generate unique IDs.
- [x] Enqueue jobs in Redis.
- [x] Verify queue contents through Redis CLI.
- [ ] Implement an independent worker process.
- [ ] Establish FIFO consumption and test ordering.
- [ ] Track job lifecycle states.
- [ ] Implement safe job claiming and recovery after worker failure.
- [ ] Add retries with exponential backoff.
- [ ] Introduce a dead-letter queue for jobs that exhaust their retries.
- [ ] Add idempotency to prevent duplicate effects.
- [ ] Support multiple workers and configurable concurrency.
- [ ] Add structured logging and operational metrics.
- [ ] Handle graceful shutdown.
- [ ] Add Docker Compose and automated tests.
- [ ] Perform load testing and document measured results.

## Current Limitations

- Jobs are stored in a Redis list, but reliable worker execution is not implemented yet.
- A Redis list alone does not guarantee safe recovery if a worker removes a job and crashes.
- The current persistence test covers a Node.js server restart while Redis stays running. Durability across Redis restarts or container recreation has not yet been verified.
- Job status is currently included in the submitted job data; a complete job-status tracking API is not implemented.
- No retry policy, dead-letter queue, or idempotency mechanism is implemented yet.

## Project Objective

Build a progressively more reliable job-processing system while understanding the underlying mechanisms: queue semantics, producer-consumer architecture, concurrency, delivery guarantees, retry policies, failure recovery, and observability.

Implementation claims and performance characteristics will be updated as each feature is built and tested.
