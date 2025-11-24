FROM node:22-slim AS builder
WORKDIR /app

# Copy package files
COPY ./frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY ./frontend ./

# Build the application
RUN npm run build

# Production image
FROM node:22-slim
WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY ./frontend/package*.json ./

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
