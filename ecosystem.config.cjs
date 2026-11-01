const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, 'server/.env') });
} catch (e) {}

const PORT = Number(process.env.PORT) || 4050;

module.exports = {
  apps: [
    {
      name: 'qubixdesk-api',
      script: './server/dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4050,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4050,
      },
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
    },
    {
      name: 'godspeed-desk-api',
      script: './dist/index.js',
      cwd: path.resolve(__dirname, 'Godspeed Ticketing/server'),
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4060,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4060,
      },
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
    },
  ],
};
