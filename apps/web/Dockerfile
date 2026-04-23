# Use Node.js base image
FROM node:22-slim AS builder

# Add essential build tools for Debian
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy lockfile and ALL package definitions for workspace resolution
COPY package.json package-lock.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
RUN find apps packages -type f ! -name "package.json" -delete

# Install dependencies (ensuring devDependencies are included despite environment settings)
ENV NODE_ENV=development
RUN npm install --include=dev

# Copy the rest of the source
COPY . .

# Build the web app directly in its workspace to ensure correct local resolution
WORKDIR /app/apps/web
ENV INTERNAL_API_URL=http://api:4000
RUN npm run build

# Production image
FROM node:22-slim AS runner

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
