const path = require('path');
try {
  require('dotenv').config({ path: path.resolve(__dirname, 'server/.env') });
} catch (e) {}

const PORT = Number(process.env.PORT) || 4000;

module.exports = {
  apps: [
    {
      name: 'qubixdesk-api',
      script: './server/dist/index.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: PORT,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: PORT,
      },
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
    },
  ],
};
