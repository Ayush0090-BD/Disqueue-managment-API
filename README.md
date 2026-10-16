# Disqueue — Distributed Job Queue

A backend engineering project built with Node.js, Express.js, and Redis to explore asynchronous job processing, producer-consumer architecture, job lifecycle tracking, and reliable message delivery.

The goal is to develop a queue-based job processing system in which API requests enqueue jobs and independent workers execute them.

> **Status:** In development. Job submission, Redis-backed queueing, independent job consumption, metadata storage, job lookup, and simulated lifecycle transitions are implemented.

## Tech Stack

- **Runtime:** Node.js
- **API:** Express.js
- **Queue and metadata storage:** Redis
- **Redis client:** node-redis
- **Containerization:** Docker
- **API testing:** Requestly, curl
- **Version control:** Git and GitHub

## Architecture

```text
                   Client
                     |
                     | POST /jobs
                     v
              Express Producer
                     |
              +------+------+
              |             |
              v             v
       Redis List: jobs   Redis Hash
       Pending jobs       job:<jobId>
              |           Job metadata
              v
       Independent Worker
              |
       Consume and process
              |
              v
       Update job status
              |
              v
       Redis Hash: job:<jobId>
```

The producer and worker are separate processes that communicate through Redis. Job metadata is stored independently of the pending queue so that a job can still be queried after the worker consumes it.

## Implemented Features

- REST API for submitting jobs.
- Request validation for job titles.
- Unique job IDs generated using UUIDs.
- Redis-backed queue using a Redis List.
- Independent worker process that consumes jobs.
- Blocking job consumption using Redis `BLPOP`.
- FIFO consumption when jobs are enqueued using `RPUSH` and consumed using `BLPOP`.
- Job metadata stored in Redis hashes using the `job:<id>` key convention.
- Job lookup endpoint using a job ID.
- Basic job lifecycle tracking: `queued`, `processing`, and `completed`.
- Simulated job execution to demonstrate lifecycle transitions.
- Basic error handling for Redis connection failures and API operations.
- Verified that queued jobs can be consumed when the worker starts, including jobs submitted before worker startup.

## API Reference

### 1. Submit a job

`POST /jobs`

Adds a new job to the Redis queue and stores its metadata.

**Request body**

```json
{
  "title": "Generate report"
}
```

**Successful response — `202 Accepted`**

```json
{
  "id": "347daa44-4319-4b89-9265-0d9325cd1dff",
  "title": "Generate report",
  "status": "queued",
  "createdat": "2026-10-16T10:00:00.000Z"
}
```

The ID and timestamp are illustrative. The actual response contains a newly generated UUID and timestamp.

**Possible responses**

- `202 Accepted` — job accepted and enqueued.
- `400 Bad Request` — invalid or missing title.
- `500 Internal Server Error` — job creation failed.

### 2. Retrieve job metadata

`GET /jobs/:id`

Retrieves a job's metadata using its ID.

**Example request**

```http
GET /jobs/347daa44-4319-4b89-9265-0d9325cd1dff
```

**Successful response — `200 OK`**

```json
{
  "id": "347daa44-4319-4b89-9265-0d9325cd1dff",
  "title": "Generate report",
  "status": "completed",
  "createdat": "2026-10-16T10:00:00.000Z"
}
```

The returned status depends on the job's current lifecycle state.

**Possible responses**

- `200 OK` — job metadata found.
- `404 Not Found` — no metadata exists for the supplied ID.
- `500 Internal Server Error` — metadata lookup failed.

## Redis Data Model

### Pending queue

```text
Key: jobs
Type: List
```

Contains serialized job objects waiting to be consumed.

The producer uses `RPUSH` to enqueue jobs, while the worker uses `BLPOP` to consume them in FIFO order.

### Job metadata

```text
Key: job:<jobId>
Type: Hash
```

Each job has its own Redis hash containing fields such as:

```text
id
title
status
createdat
```

Separating metadata from the queue allows the API to retrieve a job even after it has been removed from the pending list.

## Run Locally

### Prerequisites

- Node.js and npm
- Docker Desktop
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Redis

If the existing Redis container is available:

```bash
docker start queue-redis
```

To verify the connection:

```bash
docker exec -it queue-redis redis-cli ping
```

Expected output:

```text
PONG
```

If you have not created a Redis container yet:

```bash
docker run -d --name queue-redis -p 6379:6379 redis
```

### 4. Start the producer API

In the project directory, run:

```bash
node index.js
```

The API listens on port `3000` and connects to Redis at `localhost:6379`.

### 5. Start the worker

Open a separate terminal and run:

```bash
node src/worker.js
```

The worker connects independently to Redis and waits for jobs.

### 6. Submit a job

Using curl:

```bash
curl.exe -i -X POST http://localhost:3000/jobs -H "Content-Type: application/json" -d "{\"title\":\"Generate report\"}"
```

### 7. Retrieve job metadata

Copy the returned ID and request:

```text
GET http://localhost:3000/jobs/<jobId>
```

You can also inspect Redis directly:

```bash
docker exec -it queue-redis redis-cli LRANGE jobs 0 -1
```

Retrieve metadata:

```bash
docker exec -it queue-redis redis-cli HGETALL "job:<jobId>"
```

Replace `<jobId>` with the actual UUID.

## Current Limitations

This is an evolving learning project, and the current implementation does not yet provide production-grade delivery guarantees.

- The worker uses `BLPOP`, which removes a job from the pending queue immediately.
- A worker crash after consuming a job can result in lost work.
- The current simulated execution is not real background business processing.
- Retry policies and a dead-letter queue are not implemented.
- Job claiming, acknowledgment, and recovery of abandoned jobs are not implemented.
- Duplicate-delivery protection and idempotency are not implemented.
- Multi-worker concurrency and race-condition handling require further testing.
- Redis durability across container recreation has not been fully verified.
- Automated tests, load tests, structured logging, and operational metrics remain planned work.

## Roadmap

- [x] Build the Express producer API.
- [x] Integrate Redis for queue storage.
- [x] Validate requests and generate unique job IDs.
- [x] Implement an independent Redis consumer.
- [x] Verify FIFO queue behavior.
- [x] Store job metadata separately from the queue.
- [x] Implement `GET /jobs/:id`.
- [x] Add basic job lifecycle status updates.
- [ ] Replace destructive consumption with atomic job claiming.
- [ ] Implement job acknowledgment.
- [ ] Add visibility timeouts and abandoned-job recovery.
- [ ] Add retries with exponential backoff.
- [ ] Implement a dead-letter queue.
- [ ] Add idempotency and duplicate-delivery protection.
- [ ] Support and test multiple concurrent workers.
- [ ] Add graceful shutdown and worker failure handling.
- [ ] Add structured logs and operational metrics.
- [ ] Add automated tests and failure-injection tests.
- [ ] Add Docker Compose for repeatable local setup.
- [ ] Perform load testing and document measured results.

## Learning Objectives

This project is intended to develop practical understanding of:

- Producer-consumer architecture.
- Redis Lists and Hashes.
- Blocking queue operations.
- Asynchronous programming in Node.js.
- Job lifecycle and state management.
- At-least-once delivery and duplicate processing.
- Worker crash recovery.
- Retry strategies and dead-letter queues.
- Concurrency, observability, and system reliability.

## Project Philosophy

The focus is not merely to enqueue and process jobs, but to understand what happens when the system behaves unexpectedly.

Each reliability feature will be implemented and tested incrementally, with its guarantees and limitations documented explicitly.
