const { redis, logger } = require("#infra");
const { Config, Const } = require("#config");

const socketApi = {
  io: null,
  flomNsp: null,
  auctionsNsp: null,
  init: async function (io) {
    this.io = io;
    this.flomNsp = io.of(Config.socketNameSpace);
    this.auctionsNsp = io.of(Config.socketAuctionsNameSpace);

    this.flomNsp.on("connection", (socket) => {
      logger.debug("Flom namespace connected: " + socket.id);

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
      logger.debug("Auctions namespace connected: " + socket.id);

      socket.on("disconnect", async (reason) => {});

      if (Config.serverType === "socket") {
        const attachListeners = require("./listeners");
        attachListeners(this, socket, "auctions");
      }
    });
  },
  emitAll(event, param, nsp = "flom") {
    this[`${nsp}Nsp`].emit(event, param);
  },
  emitToSocket(socketId, event, param, nsp = "flom") {
    this[`${nsp}Nsp`].to(socketId).emit(event, param);
  },
  emitToUser(userId, event, param, nsp = "flom") {
    this.emitToRoom(userId, event, param, nsp);
  },
  emitToRoom(roomName, event, param, nsp = "flom") {
    this[`${nsp}Nsp`].to(roomName).emit(event, param);
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
  async join(userId, roomId, nsp = "flom") {
    const value = await redis.get(Const.redisKeyUserId + userId);
    if (!value) return;

    value.forEach((socket) => {
      const socketId = socket.socketId;
      socket = this[`${nsp}Nsp`].sockets.get(socketId);

      if (socket) socket.join(roomId);
    });
  },
  async leave(userId, roomId, nsp = "flom") {
    const value = await redis.get(Const.redisKeyUserId + userId);
    if (!value) return;

    const namespace = this[`${nsp}Nsp`];
    if (namespace) {
      console.log(`Namespace ${namespace.name} exists`);

      const sockets = namespace.sockets;
      console.log(`Sockets in namespace ${namespace.name}: `, Object.keys(sockets));
    }

    value.forEach((socket) => {
      const socketId = socket.socketId;
      socket = this[`${nsp}Nsp`].sockets.get(socketId);

      if (socket) {
        logger.debug(`Socket ${socketId} leaving room ${roomId}`);
        socket.leave(roomId);
      }
    });
  },
};

module.exports = socketApi;
