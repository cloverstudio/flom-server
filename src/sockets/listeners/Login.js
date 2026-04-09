const { logger, redis } = require("#infra");
const { Const } = require("#config");
const { Group, Room } = require("#models");
const Base = require("./Base");
const socketApi = require("../socket-api");

let timer;

function setTimer(socket, callData) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    socketApi.emitToSocket(socket.id, "call_request", {
      user: callData.user,
      mediaType: callData.mediaType,
      callRoomId: callData.callRoomId,
    });
  }, 1000);
}

async function newSocketConnection(socket, user) {
  try {
    const socketId = socket.id;
    const userId = user._id.toString();

    // make user online
    await redis.set(Const.redisKeyOnlineStatus + userId, {
      onlineTimestamp: Date.now(),
    });

    // save user data
    await redis.set(Const.redisKeySocketId + socketId, user);

    // add socket id to the user
    let val = await redis.get(Const.redisKeyUserId + userId);
    if (!val) val = [];
    val.push({
      socketId: socketId,
      connected: Date.now(),
    });

    await redis.set(Const.redisKeyUserId + userId, val);

    return true;
  } catch (error) {
    logger.error("login listener, newSocketConnection", error);
    return false;
  }
}

module.exports = function (socket) {
  socket.on("login", async function (param) {
    try {
      param.socketid = socket.id;

      if (!param.processId) {
        socket.emit("socketerror", { code: Const.responsecodeLoginInvalidParam });
        console.log("Login invalid param", param);
        return;
      }

      const user = await Base.checkToken(param.token);
      if (!user) {
        socket.emit("socketerror", { code: Const.responsecodeSigninInvalidToken });
        console.log("Login invalid token", param);
        return;
      }

      const userId = user._id.toString();
      socket.join(userId);

      const muted = user.muted ?? [];

      const groups = await Group.find({ users: userId }).lean();
      for (const group of groups) {
        const groupId = group._id.toString();

        if (!muted.includes(groupId)) {
          socket.join("2-" + groupId);
        }
      }

      const rooms = await Room.find({ users: userId }).lean();
      for (const room of rooms) {
        const roomId = room._id.toString();

        if (!muted.includes(roomId)) {
          socket.join("3-" + roomId);
        }
      }

      let callData;
      const keys = await redis.keys(Const.redisCallQueue + "_" + userId + "_*");
      if (keys && keys.length > 0) {
        callData = await redis.get(keys[0]);
      }

      if (callData) {
        setTimer(socket, callData);
      }

      const status = await newSocketConnection(socket, user);
      if (status) {
        socket.emit("logined", { user });
      }
      socketApi.emitAll("onlineStatus", { userId, online: status });

      return;
    } catch (error) {
      logger.error("login listener", error);
      return;
    }
  });
};
