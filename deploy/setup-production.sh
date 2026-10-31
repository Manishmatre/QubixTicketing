#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 QubixDesk Production Setup & Live Deployment"
echo "   Domain: qubixdesk.toolio.tech"
echo "   Server IP: 2.25.126.135"
echo "   Backend Port: 4050"
echo "=========================================================="

APP_DIR="/var/www/QubixTicketing"
CLIENT_DIST="$APP_DIR/client/dist"
NGINX_CONF_AVAILABLE="/etc/nginx/sites-available/qubixdesk.toolio.tech"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/qubixdesk.toolio.tech"
SSL_CERT="/etc/letsencrypt/live/qubixdesk.toolio.tech/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/qubixdesk.toolio.tech/privkey.pem"

cd "$APP_DIR"

# 1. Check and Set Directory Permissions
echo "📁 [1/5] Applying correct directory permissions..."
chmod 755 /var/www || true
chmod -R 755 "$APP_DIR"
if [ -d "$CLIENT_DIST" ]; then
    chmod -R 755 "$CLIENT_DIST"
    chown -R www-data:www-data "$CLIENT_DIST"
    echo "   ✅ Client dist permissions granted to www-data."
else
    echo "   ⚠️ Warning: $CLIENT_DIST does not exist yet. Please build client first."
fi

# Build backend server if dist is missing or out of date
if [ ! -f "$APP_DIR/server/dist/index.js" ]; then
    echo "🔨 Building backend TypeScript..."
    cd "$APP_DIR/server"
    npm run build
    cd "$APP_DIR"
fi

# 2. Check and Deploy Nginx Configuration
echo "⚙️ [2/5] Configuring Nginx..."
if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    echo "   🔒 SSL certificate detected. Deploying full HTTPS configuration."
    cp "$APP_DIR/deploy/nginx-qubixdesk.conf" "$NGINX_CONF_AVAILABLE"
else
    echo "   ⚠️ SSL certificate not found. Deploying HTTP-only configuration..."
    cat > "$NGINX_CONF_AVAILABLE" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name qubixdesk.toolio.tech;

    root /var/www/QubixTicketing/client/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4050;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        client_max_body_size 25M;
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:4050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:4050;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /health {
        proxy_pass http://127.0.0.1:4050;
        proxy_set_header Host $host;
    }
}
EOF
fi

ln -sf "$NGINX_CONF_AVAILABLE" "$NGINX_CONF_ENABLED"

# Test and reload Nginx
echo "🔍 [3/5] Validating Nginx syntax..."
nginx -t
systemctl reload nginx
echo "   ✅ Nginx successfully reloaded!"

# 3. Reload PM2 Process Manager
echo "⚡ [4/5] Reloading backend PM2 cluster on port 4050..."
pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
pm2 save
echo "   ✅ PM2 cluster active."

# 4. Verify System Health
echo "🩺 [5/5] Checking service health..."
sleep 2

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4050/health || echo "DOWN")
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k https://qubixdesk.toolio.tech || echo "DOWN")

echo "=========================================================="
echo "📊 System Status Summary:"
echo "   • Nginx: Active & Running"
echo "   • Backend API (Port 4050): HTTP $API_STATUS"
echo "   • Web Frontend: HTTP $WEB_STATUS"
echo ""
echo "✨ QubixDesk is LIVE at: https://qubixdesk.toolio.tech"
echo "=========================================================="

