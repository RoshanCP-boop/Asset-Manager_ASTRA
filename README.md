# Asset Management System

A modern, full-stack asset management application for tracking hardware and software assets, managing users with role-based access control, and maintaining a complete audit history.

## Features

- **Asset Tracking**: Manage hardware (laptops, monitors, phones, accessories) and software subscriptions
- **User Management**: Role-based access control (Admin, Manager, Employee, Auditor)
- **Seat Management**: Track software subscription seats with assign/return functionality
- **Bulk Operations**: Assign multiple assets to users at once
- **Audit History**: Complete event log for all asset changes
- **Search & Filter**: Find assets and users quickly with search and filtering
- **Pagination**: Efficiently browse large datasets
- **Modern UI**: Clean, responsive interface with animations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL 16 |
| Auth | JWT tokens |
| Container | Docker Compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)
- [Node.js](https://nodejs.org/) 18+ (for frontend)
- [uv](https://github.com/astral-sh/uv) (Python package manager, for backend)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/RoshanCP-boop/asset-management.git
cd asset-management
```

### 2. Start the database

```bash
docker compose up -d db
```

### 3. Start the backend

```bash
cd backend
uv sync                                          # Install dependencies
uv run alembic upgrade head                      # Run database migrations
uv run uvicorn app.main:app --reload --port 8000 # Start server
```

On first startup, a default admin account is created:
```
==================================================
🔐 FIRST RUN: Default admin account created
==================================================
   Email:    admin@localhost
   Password: <random-password>
==================================================
   ⚠️  Please log in and change this password!
==================================================
```

### 4. Start the frontend

```bash
cd frontend
npm install     # Install dependencies
npm run dev     # Start dev server
```

### 5. Open the app

Visit [http://localhost:3000](http://localhost:3000) and log in with the admin credentials from step 3.

## Project Structure

```
asset-management/
├── backend/
│   ├── app/
│   │   ├── routers/       # API endpoints
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── crud.py        # Database operations
│   │   ├── auth.py        # Authentication helpers
│   │   └── main.py        # FastAPI app
│   ├── migrations/        # Alembic migrations
│   └── pyproject.toml     # Python dependencies
├── frontend/
│   ├── app/               # Next.js pages
│   ├── components/        # UI components
│   ├── lib/               # Utilities & API client
│   └── package.json       # Node dependencies
└── docker-compose.yml     # Database container
```

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: manage assets, users, and approve requests |
| **Manager** | View users, request new users, manage assets |
| **Employee** | View and manage assigned assets only |
| **Auditor** | Read-only access to all data |

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://asset_user:asset_pass@localhost:5432/asset_db
SECRET_KEY=your-secret-key-here
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Documentation

When the backend is running, visit:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Development

### Running tests
```bash
# Backend
cd backend
uv run pytest

# Frontend
cd frontend
npm test
```

### Database migrations
```bash
cd backend
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

## License

MIT
