# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build shared package
RUN cd shared && npm run build

# Build backend
RUN cd backend && npm run build

# Build frontend
RUN cd frontend && npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built applications
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/shared/dist ./shared/dist

# Copy environment file
COPY env.example .env

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

# Start the application
CMD ["node", "backend/dist/index.js"]
