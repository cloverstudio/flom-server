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
const { db, logger, redis, webRtc } = require("./infra");

async function startServer() {
  await db.init();
  await redis.init();

  const onlineStatusChecker = require("./services/online-status-checker");
  const app = require("./app");
  const { init: initSockets } = require("./sockets");
  const { scheduler } = require("./services");

  const server = http.createServer(app);
  const io = await initSockets(server);
  webRtc.init(io);

  onlineStatusChecker.start();

  if (Config.runScheduler && (Config.environment === "development" || Config.instance == "0")) {
    scheduler.init();
  }

  server.listen(Config.port.api, () => {
    logger.notice(`API server is running on port ${Config.port.api}`);
  });
}

startServer();
