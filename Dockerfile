# Stage 1: Dependency Installation & Compilation Build Space
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configuration manifests
COPY package*.json ./

# Clean block install
RUN npm ci

# Copy entire application source
COPY . .

# Compile optimized static bundles and unified product microservice
RUN npm run build

# Stage 2: High-Performance Alpine Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package configurations
COPY package*.json ./

# Install production-only dependencies for maximum container compression
RUN npm ci --only=production

# Retrieve compiled distribution outputs from builder stage
COPY --from=builder /app/dist ./dist

# Expose required container routing port
EXPOSE 3000

# Launch standalone production application
CMD ["npm", "run", "start"]
