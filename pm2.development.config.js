module.exports = {
  apps: [
    {
      name: "flom-api-server",
      script: "./src/api-server.js",
      exec_mode: "fork",
      interpreter: "/home/flom/.nvm/versions/node/v20.19.3/bin/node",
      // log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
      env: { SERVER_TYPE: "api" },
    },
    {
      name: "flom-socket-server",
      script: "./src/socket-server.js",
      exec_mode: "fork",
      interpreter: "/home/flom/.nvm/versions/node/v20.19.3/bin/node",
      // log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
      env: { SERVER_TYPE: "socket" },
    },
    {
      name: "flom-bonus-consumer-v2",
      script: "./src/rabbitmq/consumer-app.js",
      exec_mode: "fork",
      interpreter: "/home/flom/.nvm/versions/node/v20.19.3/bin/node",
      // log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
    },
  ],
};
