#!/bin/bash
set -e

echo "========================================================"
echo "🚀 Deploying Godspeed Operations Desk"
echo "   Domain: https://ticketing.godspeedhomesales.com"
echo "   Server IP: 2.25.126.135"
echo "========================================================"

# 1. Pull latest changes
git pull origin main

# 2. Ensure environment file exists
if [ ! -f "Godspeed Ticketing/server/.env" ]; then
    echo "Creating Godspeed server .env from example..."
    cp "Godspeed Ticketing/server/.env.example" "Godspeed Ticketing/server/.env"
fi

# 3. Install dependencies
cd "Godspeed Ticketing"
npm install

# 4. Build server and client
npm run build
cd ..

# 5. Reload PM2
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
    pm2 save
    echo "✅ PM2 process manager reloaded."
else
    echo "ℹ️ PM2 is not installed globally. Run: npm install -g pm2"
fi

echo "========================================================"
echo "✨ Godspeed Desk is running and live at: https://ticketing.godspeedhomesales.com"
echo "========================================================"

