# ================================
# Stage 1: Build Stage
# ================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_ENV=production

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENV=$VITE_ENV

# Build the application
RUN npm run build

# ================================
# Stage 2: Production Stage (Nginx)
# ================================
FROM nginx:1.25-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

