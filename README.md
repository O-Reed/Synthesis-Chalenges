# Mini Orchestrator

A simple agent orchestration system built in 12 hours.

## What it does

**Agents (3):**
- `http_fetch` – GET a URL, return text
- `text_stats` – count lines/words/chars from the fetched text  
- `save_mysql` – persist the stats into MySQL

**Graph (simple chain):** http_fetch → text_stats → save_mysql

**Single service:** Node.js + Express + MySQL only. No Redis, no queues.

## How to run

```bash
# from the folder containing docker-compose.yml
docker compose up --build
```

## Try it

```bash
# start a run against a public text
curl -X POST http://localhost:8080/runs \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://www.gutenberg.org/cache/epub/1342/pg1342.txt"}'

# check status (replace 1 with returned run_id)
curl http://localhost:8080/runs/1 | jq
```

## What you'll see

- `runs.status` moves from PENDING → RUNNING → SUCCEEDED or FAILED
- `run_nodes` entries for each agent with outputs/errors
- `stats_results` row with counts for the URL

## Architecture

- **Simple linear execution** - no complex DAG logic
- **MySQL persistence** - tracks runs, nodes, and results
- **Basic retry/timeout** - per-node with simple backoff
- **Minimal API** - just POST /runs and GET /runs/:id
- **TypeScript** - for type safety and better DX

## Files

- `docker-compose.yml` - MySQL + Node.js setup
- `src/db.ts` - Database connection and migration
- `src/agents/*.ts` - The three agents
- `src/orchestrator.ts` - Simple linear execution logic
- `src/index.ts` - Express server with minimal endpoints

Built for simplicity and speed. No over-engineering.
