# Build stage for frontend
FROM oven/bun:1 AS builder
WORKDIR /build

# Accept build arguments for version information
ARG REACT_APP_GIT_HASH
ARG REACT_APP_BUILD_DATE

# Set them as environment variables for the build process
ENV REACT_APP_GIT_HASH=$REACT_APP_GIT_HASH
ENV REACT_APP_BUILD_DATE=$REACT_APP_BUILD_DATE

# Copy only the files needed for installing dependencies
COPY package.json bun.lockb ./
RUN bun install

# Copy source files and build configuration
COPY src ./src
COPY rsbuild.config.mjs ./
RUN exec bun run build

# Final stage
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    supervisor \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend files from builder stage
COPY --from=builder /build/build/dist ./dist

# Copy seal directory
COPY seal_widget ./seal_widget

# Copy configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port 80 for Nginx
EXPOSE 80

CMD ["/usr/bin/supervisord"]