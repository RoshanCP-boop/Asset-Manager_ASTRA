# Asset Management - Backend

FastAPI backend for the Asset Management System.

See the [main README](../README.md) for full documentation.

## Quick Start

```bash
# Start database first
docker compose up -d db

# Install dependencies and run
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Tech Stack

- FastAPI
- SQLAlchemy ORM
- PostgreSQL
- Pydantic
- Alembic (migrations)
- JWT authentication
