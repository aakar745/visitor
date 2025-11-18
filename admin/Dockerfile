# ================================
# Stage 1: Build Stage
# ================================
FROM node:22-alpine AS build

# Declare build arguments
ARG VITE_API_BASE_URL
ARG VITE_ENV
ARG GIT_SHA

WORKDIR /app

# Copy package files and config
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY src ./src
COPY index.html ./
COPY public ./public

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ENV=$VITE_ENV

# Build the application
RUN npm run build

# ================================
# Stage 2: Production Stage
# ================================
FROM node:22-alpine

WORKDIR /app

# Install serve package for serving static files
RUN npm install -g serve

# Copy built application
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5000

# Serve the built React app with SPA routing support
CMD ["serve", "-s", "dist", "-l", "5000"]
