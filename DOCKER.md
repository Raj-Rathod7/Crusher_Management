# Local Docker Setup

## Prerequisites

- Docker Desktop with Compose enabled
- Ports `3000`, `3306`, and `8081` available

Copy `.env.example` to `.env` and change the development secrets if needed. The default values are intended for local use only.

## Start the application

From the repository root:

```bash
docker compose build
docker compose up -d
```

Open the client at <http://localhost:3000>. The API is available at <http://localhost:8081>, and the API health endpoint is <http://localhost:8081/actuator/health>.

The client starts after MySQL and the Spring Boot API report healthy. MySQL data persists in the `mysql_data` named volume.

## Load demo data

Demo data is not loaded automatically. Run this after the normal stack is running:

```bash
docker compose --profile seed run --rm db-seed
```

The seed is rerunnable. Demo accounts use the password `password`:

- `demo-admin`
- `demo-manager`

## Useful commands

```bash
docker compose ps
docker compose logs -f server
docker compose down
docker compose down -v  # also deletes the local database volume
```