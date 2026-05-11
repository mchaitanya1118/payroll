# Coolify Deployment Guide

This project is optimized for deployment on **Coolify**. Follow these steps to ensure a flawless deployment.

## 1. Setup Database
In Coolify, create a new **PostgreSQL** service.
- **Service Name**: `db` (or anything you like)
- **Database Name**: `neqtra_payroll`
- **User**: `user`
- **Password**: `password`

## 2. Deploy API Service
Create a new **Docker Compose** or **Public Repository** service.

### General Settings:
- **Build Context**: `./` (Root of the monorepo)
- **Dockerfile Path**: `apps/api/Dockerfile`

### Required Environment Variables:
Set these in the Coolify service settings:
- `DATABASE_URL`: `postgresql://user:password@db:5432/neqtra_payroll?schema=public`
- `JWT_SECRET`: `your_secure_random_string`
- `PORT`: `4000`
- `NODE_ENV`: `production`

### Healthcheck:
Coolify will automatically detect the `HEALTHCHECK` in the Dockerfile. It calls `http://localhost:4000/health`.

---

## 3. Deploy Web Service
Create another service for the frontend.

### General Settings:
- **Build Context**: `./` (Root of the monorepo)
- **Dockerfile Path**: `apps/web/Dockerfile`

### Required Environment Variables:
- `INTERNAL_API_URL`: `http://api:4000` (Internal address of the API service)
- `NEXT_PUBLIC_API_URL`: `/api` (Usually left as `/api` because of Next.js rewrites)
- `PORT`: `3000`
- `NODE_ENV`: `production`

---

## 4. Docker Compose Deployment (Recommended)
You can also deploy the entire stack using the `docker-compose.yaml` in the root. 

1. Create a new **Docker Compose** service in Coolify.
2. Paste the contents of `docker-compose.yaml`.
3. Coolify will manage the internal networking and volume persistence.

### Important Note on Volumes:
- `postgres_data`: Persists your database.
- `whatsapp_session`: Persists your WhatsApp login session so you don't have to scan the QR code every time you redeploy.

## Troubleshooting
- **Database connection**: If the API fails to start, ensure the `DATABASE_URL` is correct and the DB service is reachable at `db:5432`.
- **WhatsApp Client**: The Dockerfile includes all Chromium dependencies. If you encounter "Browser crashed" errors, ensure your Coolify server has enough memory (at least 2GB recommended).
- **Prisma Migrations**: The API Dockerfile automatically runs `npx prisma migrate deploy` on startup. If migrations fail, check the API logs.
