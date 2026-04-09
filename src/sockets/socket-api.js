const { redis, logger } = require("#infra");
const { Config, Const } = require("#config");

const socketApi = {
  io: null,
  flomNsp: null,
  auctionsNsp: null,
  init: async function (io) {
    this.io = io;
    this.flomNsp = io.of(Config.socketNameSpace);
    console.log(this.flomNsp);
    this.auctionsNsp = io.of(Config.socketAuctionsNameSpace);
    console.log(this.auctionsNsp);

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
        const attachListeners = require("./listeners");
        attachListeners(this, socket);
      }
    });

    this.auctionsNsp.on("connection", (socket) => {
      logger.debug("Auctions namespace connected: ", socket.id);
      logger.debug("Auctions socket data printout: ", JSON.stringify(socket.data, null, 2));

      socket.on("disconnect", async (reason) => {});

      if (Config.serverType === "socket") {
        const attachListeners = require("./listeners");
        attachListeners(this, socket, "auctions");
      }
    });
  },
  emitAll(command, param, nsp = "flom") {
    this[`${nsp}Nsp`].emit(command, param);
  },
  emitToSocket(socketId, command, param, nsp = "flom") {
    this[`${nsp}Nsp`].to(socketId).emit(command, param);
  },
  temporaryListener(socketId, command, timeout, nsp = "flom") {
    const socket = this[`${nsp}Nsp`].sockets.get(socketId);

    if (!socket) {
      return;
    }

    setTimeout(() => {
      socket.removeAllListeners(command);
    }, timeout);

    socket.on(command, function () {
      socket.removeAllListeners(command);
    });
  },
  emitToUser(userId, command, param, nsp = "flom") {
    const target = nsp === "flom" ? this.flomNsp : this.auctionsNsp;
    target.emitToRoom(userId, command, param);
  },
  emitToRoom(roomName, command, param, nsp = "flom") {
    this[`${nsp}Nsp`].to(roomName).emit(command, param);
  },
  async joinTo(userId, type, roomId, nsp = "flom") {
    const value = await redis.get(Const.redisKeyUserId + userId);
    if (!value) return;

    value.forEach((socket) => {
      const socketId = socket.socketId;
      socket = this[`${nsp}Nsp`].sockets.get(socketId);

      if (socket) socket.join(type + "-" + roomId);
    });
  },
  async leaveFrom(userId, type, roomId, nsp = "flom") {
    const value = await redis.get(Const.redisKeyUserId + userId);
    if (!value) return;

    value.forEach((socket) => {
      const socketId = socket.socketId;
      socket = this[`${nsp}Nsp`].sockets.get(socketId);

      if (socket) socket.leave(type + "-" + roomId);
    });
  },
};

module.exports = socketApi;
