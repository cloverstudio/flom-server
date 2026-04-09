const { logger, redis } = require("#infra");
const { Const } = require("#config");
const { CallLog, User } = require("#models");
const socketApi = require("../sockets/socket-api");

const deleteCallByUserId = require("./deleteCallByUserId");
const sendPush = require("./sendPush");

async function cancelCall(socket, param, callback) {
  try {
    if (typeof callback === "function") {
      callback({ info: "call cancel received" });
    }

    if (!param.userId) {
      logger.error("call_cancel socketerror", {
        code: Const.responsecodeCallingInvalidParamInvalidUserId,
      });
      return socket.emit("socketerror", {
        code: Const.responsecodeCallingInvalidParamInvalidUserId,
      });
    }

    const { userId, callRoomId } = param;
    logger.info("cancelCall", { param });
    await deleteCallByUserId(userId);

    const userFrom = await redis.get(Const.redisKeySocketId + socket.id);
    logger.info("cancelCall", {
      userFromId: userFrom._id.toString(),
      userFromPhoneNumber: userFrom.phoneNumber,
      userFromUserName: userFrom.userName,
    });

    if (!userFrom) {
      return logger.info("cancelCall, no userFrom found");
    }

    if (callRoomId) {
      const callLog = await redis.get(Const.redisCallLog + callRoomId);

      logger.info("cancelCall, oldCallLog: " + JSON.stringify(callLog));

      const newCallLog = {
        ...callLog,
        status: Const.callStatusCallerCancel,
        callStatus: Const.callStatusEnded,
      };

      logger.info("cancelCall, newCallLog: " + JSON.stringify(newCallLog));

      await redis.set(Const.redisCallLog + callRoomId, newCallLog);

      logger.info("cancelCall", { newCallLog });

      const newCallLogId = newCallLog._id.toString();
      delete newCallLog._id;

      await redis.del(Const.redisCallLog + callRoomId);

      logger.info("cancelCall, newCallLogId: " + newCallLogId);
      await CallLog.findByIdAndUpdate(newCallLogId, newCallLog);

      logger.info("cancelCall, callLog saved to db");
    } else {
      await CallLog.updateStatusByCallerId(
        userFrom._id,
        Const.callStatusCallerCancel,
        Const.callStatusEnded,
      );
    }

    const userTo = await User.findOne({ _id: userId }).lean();

    if (!userTo) {
      return;
    }

    logger.info("cancelCall", {
      userToId: userTo._id.toString(),
      userToPhoneNumber: userTo.phoneNumber,
      userToUserName: userTo.userName,
    });

    const { pushToken } = userTo;
    const validatedTokens = [];

    if (pushToken && pushToken.length) {
      validatedTokens.push(...pushToken.filter((token) => token).map((token) => ({ token })));
    }

    if (!validatedTokens.length) {
      return logger.info("cancelCall, no receivers tokens found");
    }

    let avatarFileName = "";
    if (userFrom.avatar && userFrom.avatar.thumbnail) {
      avatarFileName = userFrom.avatar.thumbnail.nameOnServer;
    }

    console.log("cancelCall", { validatedTokens });

    sendPush(validatedTokens, {
      message: {
        message: userFrom.name + " hung up call.",
        messageiOS: userFrom.name + " hung up call.",
      },
      pushType: Const.pushTypeCallClose,
      callRoomId,
      from: {
        _id: userFrom._id,
        name: userFrom.name,
        avatarFileName: avatarFileName,
      },
      to: {
        _id: userTo._id,
      },
      isHighPriority: true,
      setShortTtl: true,
    });

    socketApi.emitToRoom(userId, "call_cancel", {
      userId: userFrom._id,
      roomId: callRoomId,
      callRoomId,
    });
  } catch (error) {
    logger.error("cancelCall error: ", error);
    return;
  }
}

module.exports = cancelCall;
