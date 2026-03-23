const { Namespace } = require("socket.io");
const { redis } = require("#infra");
const { Const } = require("#config");

class SocketApi {
  /**
   * @type {Namespace}
   */
  nsp = null;

  constructor() {
    this.nsp = null;
  }

  attachNamespace(namespace) {
    this.nsp = namespace;
  }

  emitAll(command, param) {
    this.nsp.emit(command, param);
  }

  emitToSocket(socketId, command, param) {
    this.nsp.to(socketId).emit(command, param);
  }

  temporaryListener(socketId, command, timeout, callBack) {
    const socket = this.nsp.sockets.get(socketId);

    if (!socket) {
      return;
    }

    setTimeout(() => {
      socket.removeAllListeners(command);
    }, timeout);

    socket.on(command, function () {
      socket.removeAllListeners(command);
    });
  }

  emitToUser(userId, command, param) {
    this.nsp.emitToRoom(userId, command, param);
  }

  emitToRoom(roomName, command, param) {
    this.nsp.to(roomName).emit(command, param);
  }

  async joinTo(userId, type, roomId) {
    const value = await redis.get(Const.redisKeyUserId + userId);
    if (!value) return;

    value.forEach((socket) => {
      const socketId = socket.socketId;
      socket = this.nsp.sockets.get(socketId);

      if (socket) socket.join(type + "-" + roomId);
    });
  }

  async leaveFrom(userId, type, roomId) {
    const value = await redis.get(Const.redisKeyUserId + userId);
    if (!value) return;

    value.forEach((socket) => {
      var socketId = socket.socketId;
      var socket = this.nsp.sockets.get(socketId);

      if (socket) socket.leave(type + "-" + roomId);
    });
  }
}

const flom = new SocketApi();
const auctions = new SocketApi();

function initNamespaces(ns = {}) {
  if (!ns.flom || !ns.auctions) {
    throw new Error("initNamespaces: no namespaces provided");
  }

  flom.attachNamespace(ns.flom);
  auctions.attachNamespace(ns.auctions);
}

module.exports = { flom, auctions, initNamespaces };
