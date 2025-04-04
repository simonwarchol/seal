# Use a Python base image that includes a slim Linux distro
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    build-essential \
    unzip \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Install pip
RUN apt-get update && apt-get install -y python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt and install Python dependencies
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy seal directory
COPY seal ./seal

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Set environment variables for Bun
ENV BUN_INSTALL="/root/.bun"
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

# Copy package files and install dependencies
COPY package.json bun.lockb rsbuild.config.mjs ./
RUN bun install

# Copy source files and build the application
COPY src ./src
RUN bun run build

# Set up Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for Nginx
EXPOSE 80

# Add supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/usr/bin/supervisord"]