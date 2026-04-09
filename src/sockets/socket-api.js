const { redis, logger } = require("#infra");
const { Config } = require("#config");
const attachListeners = require("./listeners");
const attachCommands = require("./attach-commands");

const socketApi = {
  io: null,
  flomNsp: null,
  auctionsNsp: null,
  flom: null,
  auctions: null,
  init: async function (io) {
    this.io = io;
    this.flomNsp = io.of(Config.socketNameSpace);
    this.auctionsNsp = io.of(Config.socketAuctionsNameSpace);

    this.flomNsp.on("connection", (socket) => {
      logger.debug("Flom namespace connected: ", socket.id);
      logger.debug("Flom socket data printout: ", JSON.stringify(socket.data, null, 2));

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
    this.flom = attachCommands(this.flomNsp);

    this.auctionsNsp.on("connection", (socket) => {
      logger.debug("Auctions namespace connected: ", socket.id);
      logger.debug("Auctions socket data printout: ", JSON.stringify(socket.data, null, 2));

      socket.on("disconnect", async (reason) => {});

      if (Config.serverType === "socket") {
        attachListeners(socket, "auctions");
      }
    });
    this.auctions = attachCommands(this.auctionsNsp);
  },
};

module.exports = socketApi;
