# GreenPrompt Guide

Next.js app with PostgreSQL via Docker Compose and Prisma ORM.

## Prerequisites

- Docker + Docker Compose plugin
- Node.js 20+ (for local non-docker workflows)

## Environment Variables

Create your environment file from the example:

```bash
cp .env.example .env
```

Key vars:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`

## Run with Docker Compose

Start database + app:

```bash
docker compose up --build -d
```

Open the app at `http://localhost:3000`.

Stop all services:

```bash
docker compose down
```

Reset database volume too:

```bash
docker compose down -v
```

## Prisma Commands

- Generate client: `npm run prisma:generate`
- Push schema to database: `npm run prisma:push`
- Introspect existing database: `npm run prisma:pull`
- Open Prisma Studio: `npm run prisma:studio`

Schema file: `prisma/schema.prisma`.

## Prisma Studio on a Remote Machine

The compose setup includes a dedicated `prisma-studio` service under the `tools` profile and binds it to `127.0.0.1:5555` on the remote host.

On the remote machine:

```bash
docker compose --profile tools up -d prisma-studio
```

From your local machine, tunnel the remote Studio port over SSH:

```bash
ssh -L 5555:127.0.0.1:5555 <user>@<remote-host>
```

Then open locally:

`http://localhost:5555`

This keeps Prisma Studio off the public internet while still allowing remote management.
