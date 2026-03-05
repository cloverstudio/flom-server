const { Server } = require("socket.io");
const { redisAdapter, redis, logger } = require("#infra");
const { Config } = require("#config");
const { initNamespaces, flom, auctions } = require("./socket-api");
const attachListeners = require("./listeners");

async function init(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
    pingInterval: 5000,
    transports: ["websocket"],
  });

  await redisAdapter(io);

  const namespaces = {
    flom: io.of(Config.socketNameSpace),
    auctions: io.of(Config.socketAuctionsNameSpace),
  };

  initNamespaces(namespaces);

  io.on("connection", (socket) => {
    socket.setTimeout(600000);
    console.log("socket connected:", socket.id);
  });

  namespaces.flom.on("connection", (socket) => {
    console.log("Namespace connected:", socket.id);

    socket.on("disconnect", async (reason) => {
      try {
        const value = await redis.get("flom_team_current_chat");
        if (value?.includes(socket.id)) {
          await redis.del("flom_team_current_chat");
        }
      } catch (error) {
        logger.error("disconnect socket error", error);
      }
    });

    if (Config.serverType === "socket") {
      attachListeners(socket);
    }
  });

  namespaces.auctions.on("connection", (socket) => {
    console.log("Auctions Namespace connected:", socket.id);

    socket.on("disconnect", async (reason) => {});

    if (Config.serverType === "socket") {
      attachListeners(socket, "auctions");
    }
  });

  return io;
}

module.exports = { init, socketApi: { flom, auctions } };
