module.exports = {
  apps: [
    {
      name: 'nestjs-app',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/nestjs-app-error.log',
      out_file: './logs/nestjs-app-out.log',
      log_file: './logs/nestjs-app-combined.log',
      time: true
    },
    {
      name: 'mcp-http-server',
      script: 'mcp-http-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        API_BASE_URL: 'http://localhost:3000'
      },
      error_file: './logs/mcp-http-error.log',
      out_file: './logs/mcp-http-out.log',
      log_file: './logs/mcp-http-combined.log',
      time: true
    },
    {
      name: 'mcp-websocket-realtime',
      script: 'mcp-websocket-realtime.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HTTP_PORT: 5000,
        WS_PORT: 5001,
        API_BASE_URL: 'http://localhost:3000',
        ENABLE_NOTIFICATIONS: 'true'
      },
      error_file: './logs/mcp-websocket-error.log',
      out_file: './logs/mcp-websocket-out.log',
      log_file: './logs/mcp-websocket-combined.log',
      time: true
    }
  ]
};
