# Use Node.js base image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package.json and monorepo files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies (including those for the monorepo)
RUN npm install --include=dev

# Copy source and prisma
COPY apps/api ./apps/api
COPY packages ./packages

# Build Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
