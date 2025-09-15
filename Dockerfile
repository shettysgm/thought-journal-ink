# Multi-stage build for React app with runtime environment injection

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Install envsubst for template processing
RUN apk add --no-cache gettext

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx config template
COPY <<EOF /etc/nginx/conf.d/default.conf.template
server {
    listen \$PORT;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Create entrypoint script for runtime environment injection
COPY <<'EOF' /docker-entrypoint.sh
#!/bin/sh
set -e

# Generate env-config.js with runtime environment variables
cat > /usr/share/nginx/html/env-config.js << EOL
window.ENV = {
  VITE_BACKEND_URL: "${VITE_BACKEND_URL:-}",
  VITE_GCP_PROJECT: "${VITE_GCP_PROJECT:-}",
  VITE_GCP_REGION: "${VITE_GCP_REGION:-}"
};
EOL

# Process nginx config template
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
EOF

# Make entrypoint executable
RUN chmod +x /docker-entrypoint.sh

# Set default port
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Expose port
EXPOSE $PORT

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]