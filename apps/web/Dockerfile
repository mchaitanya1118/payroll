# Use Node.js base image
FROM node:22-alpine AS builder

# Add compatibility for modern build tools and native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy lockfile and package definitions first for better caching
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --include=dev

# Copy the rest of the source
COPY . .

# Build the Next.js app
WORKDIR /app/apps/web
ENV INTERNAL_API_URL=http://api:4000
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js standalone output
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/.next/standalone ./

EXPOSE 3000

# The standalone output preserves the monorepo structure
CMD ["node", "apps/web/server.js"]
