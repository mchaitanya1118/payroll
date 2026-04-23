# Use Node.js base image
FROM node:22 AS builder

WORKDIR /app

# Copy root package.json and monorepo files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
# Copy all source files
COPY . .

# Install dependencies (including those for the monorepo)
RUN npm install --include=dev

# Build the Next.js app
WORKDIR /app/apps/web
ENV INTERNAL_API_URL=http://api:4000
RUN npm run build

# Production image
FROM node:22 AS runner

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
