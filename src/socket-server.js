"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

process.on("uncaughtException", (err, origin) => {
  console.log("Uncaught exception", err, origin);
  console.error("Uncaught exception", err, origin);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const http = require("http");
const { Config } = require("./config");
const { db, logger, redis } = require("./infra");

async function startServer() {
  await db.init();
  await redis.init();
  const server = http.createServer();

  const sockets = require("./sockets");
  await sockets.init(server);

  server.listen(Config.port.socket, () => {
    logger.notice(`Socket server is running on port ${Config.port.socket}`);
  });
}

startServer();
