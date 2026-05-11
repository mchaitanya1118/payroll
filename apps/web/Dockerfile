# Use Node.js base image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and all workspace package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

# Install dependencies for the entire monorepo
RUN npm install --include=dev

# Copy source
COPY apps/web ./apps/web

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

# Healthcheck for Coolify
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); })" || exit 1

# The standalone output preserves the monorepo structure
CMD ["node", "apps/web/server.js"]
