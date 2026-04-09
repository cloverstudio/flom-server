const { redis } = require("#infra");
const { Const } = require("#config");

function attachCommands(nsp) {
  return {
    emitAll(command, param) {
      nsp.emit(command, param);
    },

    emitToSocket(socketId, command, param) {
      nsp.to(socketId).emit(command, param);
    },

    temporaryListener(socketId, command, timeout, callBack) {
      const socket = nsp.sockets.get(socketId);

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

    emitToUser(userId, command, param) {
      nsp.emitToRoom(userId, command, param);
    },

    emitToRoom(roomName, command, param) {
      nsp.to(roomName).emit(command, param);
    },

    async joinTo(userId, type, roomId) {
      const value = await redis.get(Const.redisKeyUserId + userId);
      if (!value) return;

      value.forEach((socket) => {
        const socketId = socket.socketId;
        socket = nsp.sockets.get(socketId);

        if (socket) socket.join(type + "-" + roomId);
      });
    },

    async leaveFrom(userId, type, roomId) {
      const value = await redis.get(Const.redisKeyUserId + userId);
      if (!value) return;

      value.forEach((socket) => {
        const socketId = socket.socketId;
        socket = nsp.sockets.get(socketId);

        if (socket) socket.leave(type + "-" + roomId);
      });
    },
  };
}

module.exports = attachCommands;
