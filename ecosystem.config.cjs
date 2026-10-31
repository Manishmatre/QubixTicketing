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
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      max_memory_restart: '800M',
      autorestart: true,
      watch: false,
    },
  ],
};
