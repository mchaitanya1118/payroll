# Use Node.js base image
FROM node:22-slim AS builder

# Install build dependencies for native modules and Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root and all workspace package files to ensure dependency resolution
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
# Copy empty folders for packages if they exist or just the package.json if they have them
COPY packages ./packages

# Install dependencies for the entire monorepo
RUN npm install --include=dev

# Copy source and prisma
COPY apps/api ./apps/api

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# Production image
FROM node:22-slim

# Install runtime dependencies for Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libnss3 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variable for Puppeteer to find Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 4000

# Healthcheck for Coolify
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); })" || exit 1

CMD ["sh", "-c", "echo '🚀 Starting API...' && npx prisma migrate deploy && echo '✅ Migrations complete' && npx prisma db seed || echo 'ℹ️ Seed skipped' && npm run start:prod"]



