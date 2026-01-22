module.exports = {
  apps: [
    {
      name: 'evalon-api',
      script: './src/server.js',
      instances: 1, // Set to 'max' for clustered mode in production
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'evalon-realtime',
      script: './src/realtimeServer.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ],
};
