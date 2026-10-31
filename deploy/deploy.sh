#!/bin/bash
set -e

echo "========================================================"
echo "🚀 Deploying QubixDesk on qubixdesk.toolio.tech"
echo "   Server IP: 2.25.126.135"
echo "========================================================"

# 1. Pull latest changes
git pull origin main

# 2. Install workspace dependencies
npm install

# 3. Compile client and server workspaces
npm run build

# 4. Restart or Start with PM2
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
    pm2 save
    echo "✅ PM2 process manager reloaded."
else
    echo "ℹ️ PM2 is not installed globally. Run: npm install -g pm2"
fi

echo "========================================================"
echo "✨ QubixDesk is running and live at: https://qubixdesk.toolio.tech"
echo "========================================================"
