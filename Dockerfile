# Multi-stage build for React app with runtime env injection

# -------- Build stage --------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# -------- Runtime stage --------
FROM nginx:stable-alpine

# Utilities: envsubst for templating, curl for healthcheck
RUN apk add --no-cache gettext curl

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config template (PORT is substituted at runtime)
RUN printf 'server {\n    listen ${PORT};\n    server_name localhost;\n\n    location / {\n        root /usr/share/nginx/html;\n        index index.html index.htm;\n        try_files $uri $uri/ /index.html;\n    }\n\n    location /health {\n        access_log off;\n        return 200 "healthy\\n";\n        add_header Content-Type text/plain;\n    }\n\n    add_header X-Frame-Options DENY;\n    add_header X-Content-Type-Options nosniff;\n    add_header X-XSS-Protection "1; mode=block";\n\n    gzip on;\n    gzip_vary on;\n    gzip_min_length 1024;\n    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;\n}\n' > /etc/nginx/conf.d/default.conf.template

# Entrypoint that writes env-config.js and renders nginx config at runtime
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  ': "${PORT:=8080}"' \
  'cat > /usr/share/nginx/html/env-config.js <<EOL' \
  'window.ENV = {' \
  '  VITE_BACKEND_URL: "${VITE_BACKEND_URL:-}",' \
  '  VITE_GCP_PROJECT: "${VITE_GCP_PROJECT:-}",' \
  '  VITE_GCP_REGION: "${VITE_GCP_REGION:-}"' \
  '};' \
  'EOL' \
  "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf" \
  "exec nginx -g 'daemon off;'" \
  > /docker-entrypoint.sh \
  && chmod +x /docker-entrypoint.sh

# Default PORT used by Cloud Run
ENV PORT=8080
EXPOSE 8080

# Remove healthcheck for Cloud Run (it has its own)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]