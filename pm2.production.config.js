module.exports = {
  apps: [
    {
      name: "flom-api-server",
      script: "./src/api-server.js",
      exec_mode: "cluster",
      interpreter: "/home/pm2user/.nvm/versions/node/v20.19.3/bin/node",
      instances: 12,
      log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
      merge_logs: true,
      env: { SERVER_TYPE: "api" },
    },
    {
      name: "flom-socket-server",
      script: "./src/socket-server.js",
      exec_mode: "fork",
      interpreter: "/home/pm2user/.nvm/versions/node/v20.19.3/bin/node",
      log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
      env: { SERVER_TYPE: "socket" },
    },
    {
      name: "flom-bonus-consumer",
      script: "./src/server/QueueConsumers/BonusConsumer.js",
      exec_mode: "fork",
      interpreter: "/home/pm2user/.nvm/versions/node/v20.19.3/bin/node",
      log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
    },
  ],
};
