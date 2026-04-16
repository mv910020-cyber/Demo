# Product Demo Platform Backend

## Run locally

1. Create virtual environment and install deps.
2. Copy `.env.example` to `.env` and update values.
3. Run migrations:

```bash
alembic upgrade head
```

4. Run server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API docs

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Core modules included

- Auth (register/login with JWT)
- User roles and permissions
- Demo request intake
- Scheduling and status tracking
- Post-demo notes
- Action items
- Requirement tracking
- Dashboard overview analytics
- Availability-aware + conflict-aware assignment
- Reminder scheduling and background dispatch
- Demo recording metadata APIs
