"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

process.on("uncaughtException", (err, origin) => {
  const ts = new Date().toISOString();
  console.log(ts, "Uncaught exception", err, origin);
  console.error(ts, "Uncaught exception", err, origin);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  const ts = new Date().toISOString();
  console.log(ts, "Unhandled Rejection at:", promise, "reason:", reason);
  console.error(ts, "Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const http = require("http");
const { Config } = require("./config");
const { db, logger, redis } = require("./infra");

async function startServer() {
  await db.init();
  await redis.init();

  const onlineStatusChecker = require("./services/online-status-checker");
  const app = require("./app");
  const { init: initSockets } = require("./sockets");

  const server = http.createServer(app);
  const io = await initSockets(server);

  onlineStatusChecker.start();

  if (Config.environment !== "local") {
    const scheduler = require("./scheduler");
    scheduler.init();
  }

  server.listen(Config.port.api, () => {
    logger.notice(`API server is running on port ${Config.port.api}`);
  });
}

startServer();
