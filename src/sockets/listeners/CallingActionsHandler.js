const { Const } = require("#config");
const Utils = require("#utils");
const { logger, redis } = require("#infra");
const { CallLog, User } = require("#models");
const socketApi = require("../socket-api");
const { deleteCallByUserId, cancelCall, sendMessage, sendPush } = require("#logics");

module.exports = function (socket) {
  /**
   * @api {socket} "call_request" make call request
   * @apiName make call request
   * @apiGroup Socket
   * @apiDescription Make call request
   * @apiParam {string} userId user id
   * @apiParam {string} mediaType 1: audio 2: video
   */
  socket.on("call_request", async function (param, callback) {
    if (typeof callback === "function") callback({ info: "call request received" });

    if (!param.userId) {
      logger.error(
        "call_request socketerror, code: " + Const.responsecodeCallingInvalidParamInvalidUserId,
      );
      socket.emit("socketerror", {
        code: Const.responsecodeCallingInvalidParamInvalidUserId,
      });
      return;
    }

    if (!param.mediaType) {
      logger.error(
        "call_request socketerror, code: " + Const.responsecodeCallingInvalidParamNoMediaType,
      );
      socket.emit("socketerror", {
        code: Const.responsecodeCallingInvalidParamNoMediaType,
      });
      return;
    }

    logger.info("call_request param: " + JSON.stringify(param));

    const userId = param.userId;
    const callRoomId = param.callRoomId;
    const callerDevice = param.device || "web";

    try {
      let userFrom = await redis.get(Const.redisKeySocketId + socket.id);

      if (!userFrom) {
        logger.error("call_request socketerror, no caller user");
        return;
      }

      const userIdFrom = userFrom._id;
      const userIdTo = userId;

      userFrom = await User.findById(userIdFrom.toString()).lean();

      // check blocked
      const userTo = await User.findById(userIdTo).lean();
      if (!userTo) {
        logger.error("call_request socketerror, user error");
        return;
      }

      const userFromBlocked = userTo.blocked.find((id) => id == userIdFrom);
      if (userFromBlocked) {
        logger.error("call_request socketerror, permission error");
        return;
      }

      let { pushToken, voipPushToken } = userTo;
      let validatedTokens = [];

      if (pushToken && pushToken.length) {
        let validatedPushTokens = pushToken
          .filter((token) => token && token.length > 64)
          .map((token) => ({ token }));

        validatedPushTokens.forEach((token) => validatedTokens.push(token));
      }

      if (voipPushToken && voipPushToken.length) {
        let validatedVoipTokens = voipPushToken
          .filter((token) => token)
          .map((token) => ({ token }));

        validatedVoipTokens.forEach((token) => validatedTokens.push(token));
      }

      const anotherCalls = await CallLog.isUserHaveAnotherCall(userTo._id.toString(), callRoomId);
      const userHasAnotherCall = anotherCalls.length > 0;

      if (userHasAnotherCall) {
        logger.error("call_request socketerror, callee user has cal!!");

        validatedTokens = validatedTokens.filter((obj) => obj.token.length < 65);

        if (validatedTokens.length === 0) {
          return socketApi.flom.emitToSocket(socket.id, "call_failed", {
            failedType: Const.callFaildUserBusy,
          });
        } else {
          logger.error("call_request socketerror, callee user has ios!!");
          const latestCall = anotherCalls[0];
          const userIsCallerInLatestCall = latestCall.callerId === userTo._id.toString();

          if (
            (userIsCallerInLatestCall && latestCall.callerDevice === "web") ||
            (!userIsCallerInLatestCall && latestCall.calleeDevice === "web")
          ) {
            logger.error("call_request socketerror, callee user is talking on web!!");
            return socketApi.flom.emitToSocket(socket.id, "call_failed", {
              failedType: Const.callFaildUserBusy,
            });
          }
        }
      }

      logger.info("call_request, start calling tokens: " + JSON.stringify(validatedTokens));

      // insert callLog
      const callLogParams = {
        type: param.mediaType,
        status: Const.callStatusUnknown,
        callStatus: Const.callStatusCalling,
        callStartAt: Date.now(),
        callerUserId: userFrom._id,
        calleeUserId: userId,
        created: Date.now(),
        callRoomId,
        callerDevice,
      };

      const callLog = await CallLog.create(callLogParams);
      const callLogObj = callLog.toObject();
      const callId = callLog._id.toString();
      await redis.set(Const.redisCallLog + callRoomId, callLogObj);

      // save to call queue for the case the user is offline
      await redis.set(Const.redisCallQueue + "_" + userId + "_" + callId, {
        user: userFrom,
        mediaType: param.mediaType,
        callRoomId: callRoomId,
      });

      setTimeout(function () {
        deleteCallByCallId(callId);
      }, 30000);

      let avatarFileName = "";
      if (userFrom.avatar && userFrom.avatar.thumbnail)
        avatarFileName = userFrom.avatar.thumbnail.nameOnServer;

      sendPush(
        validatedTokens,
        {
          message: {
            message: userFrom.name + " is calling.",
            messageiOS: userFrom.name + " is calling.",
          },
          pushType: Const.pushTypeCall,
          from: {
            _id: userFrom._id,
            name: userFrom.name,
            phoneNumber: userFrom.phoneNumber,
            avatarFileName,
            avatar: userFrom.avatar,
            userName: userFrom.userName,
            created: userFrom.created,
          },
          to: {
            _id: userTo._id,
            created: userTo.created,
          },
          callRoomId: callRoomId,
          mediaType: param.mediaType,
          isHighPriority: true,
          setShortTtl: true,
        },
        true,
      );

      Utils.stripPrivateData(userFrom);

      if (!userHasAnotherCall) {
        socketApi.flom.emitToRoom(userId, "call_request", {
          user: userFrom,
          mediaType: param.mediaType,
          callRoomId: callRoomId,
        });
      }
    } catch (error) {
      logger.error("call_request socketerror", error);

      socketApi.flom.emitToSocket(socket.id, "call_failed", {
        failedType: Const.callFaildUserBusy,
      });
    }
  });

  /**
   * @api {socket} "call_cancel" cancel call request
   * @apiName cancel call request
   * @apiGroup Socket
   * @apiDescription cancel call request
   * @apiParam {string} userId user id
   */

  socket.on("call_cancel", (param, callback) => cancelCall(socket, param, callback));

  /**
   * @api {socket} "call_reject" reject call request
   * @apiName reject call request
   * @apiGroup Socket
   * @apiDescription reject call request
   * @apiParam {string} userId user id
   * @apiParam {string} rejectType 2: user busy 3: user declined
   */

  socket.on("call_reject", async function (param, callback) {
    try {
      if (typeof callback === "function") callback({ info: "call reject received" });

      if (!param.userId) {
        logger.error(
          "call_reject socketerror, code: " + Const.responsecodeCallingInvalidParamInvalidUserId,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamInvalidUserId });
        return;
      }

      if (!param.rejectType) {
        logger.error(
          "call_reject socketerror, code: " + Const.responsecodeCallingInvalidParamNoRejectType,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamNoRejectType });
        return;
      }

      logger.info(`call_reject param: ${JSON.stringify(param)}`);

      const userId = param.userId;
      const userFrom = await redis.get(Const.redisKeySocketId + socket.id);
      if (!userFrom) {
        logger.error(
          `call_reject socketerror - userFrom not found for socket with id: ${socket.id} on call with user: ${userId}`,
        );
      }

      if (param.callRoomId) {
        const callRoomId = param.callRoomId;
        const callLog = await redis.get(Const.redisCallLog + callRoomId);

        console.log("oldCallLog: " + JSON.stringify(callLog));

        const newCallLog = {
          ...callLog,
          status: param.rejectType == 3 ? Const.callStatusCalleeRejected : Const.callStatusUserBusy,
          callStatus: Const.callStatusEnded,
        };

        await redis.set(Const.redisCallLog + callRoomId, newCallLog);

        const callLogId = newCallLog._id.toString();
        delete newCallLog._id;

        await redis.del(Const.redisCallLog + callRoomId);
        await CallLog.findByIdAndUpdate(callLogId, newCallLog);
        logger.info("call_reject - callLog saved to db");
      } else {
        await CallLog.updateStatusByCallerId(
          userFrom._id,
          param.rejectType == 3 ? Const.callStatusCalleeRejected : Const.callStatusUserBusy,
          Const.callStatusEnded,
        );
      }

      socketApi.flom.emitToRoom(userId, "call_failed", {
        failedType: param.rejectType,
        callRoomId: param.callRoomId || null,
      });

      if (userFrom) {
        socketApi.flom.emitToRoom(userFrom._id, "call_reject_mine", {
          callRoomId: param.callRoomId || null,
        });
      }
    } catch (error) {
      logger.error("call_reject socketerror", error);
    }
  });

  /**
   * @api {socket} "call_received" send call_received to caller
   * @apiName call received
   * @apiGroup Socket
   * @apiDescription send call_received to caller
   * @apiParam {string} userId user id
   */

  socket.on("call_received", async function (param, callback) {
    try {
      if (typeof callback === "function") callback({ info: "call received received" });

      if (!param.userId) {
        logger.error(
          "call_received socketerror, code: " + Const.responsecodeCallingInvalidParamInvalidUserId,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamInvalidUserId });
        return;
      }

      logger.info("call_received: " + JSON.stringify(param));
      // this userId is caller here
      const userId = param.userId;
      const calleeDevice = param.device || "web";

      if (param.callRoomId) {
        const callRoomId = param.callRoomId;

        const callLog = await redis.get(Const.redisCallLog + callRoomId);

        if (!callLog) {
          logger.info("call_received " + 5.5);
          logger.info("call_received, ended call");
          if (typeof callback === "function") callback({ info: "call doesnt exist" });
          return;
        }

        if (callLog.callStatus == Const.callStatusEnded) {
          logger.info("call_received " + 6);
          logger.info("call_received, ended call");
          if (typeof callback === "function") callback({ info: "call ended" });
          return;
        }

        const newCallLog = {
          ...callLog,
          status: Const.callStatusUnknown,
          callStatus: Const.callStatusRinging,
          calleeDevice,
        };

        await redis.set(Const.redisCallLog + callRoomId, newCallLog);

        const callLogId = newCallLog._id.toString();
        delete newCallLog._id;

        setTimeout(() => {
          CallLog.findByIdAndUpdate(callLogId, newCallLog).then(() => {
            logger.info("call_received, callLog saved to db");
          });
        }, 1);
      } else {
        await CallLog.updateStatusByCallerId(
          userId,
          Const.callStatusUnknown,
          Const.callStatusRinging,
        );
      }

      let userFrom = await redis.get(Const.redisKeySocketId + socket.id);

      if (!userFrom) {
        logger.error(
          `call_received - userFrom not found for socket with id: ${socket.id} on call with user: ${userId}`,
        );
      }

      if (userFrom && userFrom._id) {
        // delete call log from queue
        deleteCallByUserId(userFrom._id);
      }

      logger.info("call received sent " + userId);
      socketApi.flom.emitToRoom(userId, "call_received", {});
    } catch (error) {
      logger.error("call_received", error);
    }
  });

  /**
   * @api {socket} "call_answer" answer to call request
   * @apiName answer to call request
   * @apiGroup Socket
   * @apiDescription answer to call request
   * @apiParam {string} userId user id
   */

  socket.on("call_answer", async function (param, callback) {
    try {
      if (!param.userId) {
        logger.error(
          "call_answer socketerror, code: " + Const.responsecodeCallingInvalidParamInvalidUserId,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamInvalidUserId });
        return;
      }

      logger.info("call_answer param: " + JSON.stringify(param));

      const userId = param.userId;
      const calleeDevice = param.device || "web";

      socketApi.flom.emitToRoom(userId, "call_answer", {
        failedType: param.rejectType,
      });

      if (param.callRoomId) {
        const callRoomId = param.callRoomId;
        const callLog = await redis.get(Const.redisCallLog + callRoomId);

        if (!callLog) {
          if (typeof callback === "function") callback({ info: "call doesnt exist" });
          return;
        }

        if (callLog.callStatus == Const.callStatusEnded) {
          if (typeof callback === "function") callback({ info: "call ended" });
          return;
        }

        if (callLog.callStatus == Const.callStatusAllConnected) {
          if (typeof callback === "function") callback(JSON.stringify(callLog));
          return;
        }

        const newCallLog = {
          ...callLog,
          status: Const.callStatusConnected,
          callStatus: Const.callStatusConnecting,
          calleeDevice,
        };

        await redis.set(Const.redisCallLog + callRoomId, newCallLog);

        const callLogId = newCallLog._id.toString();
        delete newCallLog._id;

        setTimeout(() => {
          CallLog.findByIdAndUpdate(callLogId, newCallLog).then(() => {
            logger.info("call_answer, callLog saved to db");
          });
        }, 1);

        if (typeof callback === "function") callback(JSON.stringify(newCallLog));
      } else {
        if (typeof callback === "function") callback({ info: "old socket event call_answer" });

        await CallLog.updateStatusByCallerId(
          userId,
          Const.callStatusConnected,
          Const.callStatusConnecting,
        );
      }

      const userFrom = await redis.get(Const.redisKeySocketId + socket.id);

      if (!userFrom) {
        logger.error(
          `call_answer - userFrom not found for socket with id: ${socket.id} on call with user: ${userId}`,
        );
      }

      let { pushToken } = userFrom;
      let validatedTokens = [];

      if (pushToken && pushToken.length) {
        validatedTokens = pushToken.filter((token) => token).map((token) => ({ token }));
      }

      if (!validatedTokens.length) {
        logger.error("call_answer, no receivers tokens found");
        return;
      }

      let avatarFileName = "";
      if (userFrom.avatar && userFrom.avatar.thumbnail) {
        avatarFileName = userFrom.avatar.thumbnail.nameOnServer;
      }

      sendPush(validatedTokens, {
        message: {
          message: "answered call.",
          messageiOS: "answered call.",
        },
        pushType: Const.pushTypeCallAnswerMine,
        callRoomId: param.callRoomId,
        from: {
          _id: userFrom._id,
          name: userFrom.name,
          avatarFileName,
        },
        to: {
          _id: userId,
        },
        isHighPriority: true,
        setShortTtl: true,
      });

      socketApi.flom.emitToRoom(userFrom._id, "call_answer_mine", {
        callRoomId: param.callRoomId || null,
      });
    } catch (error) {
      logger.error("call_answer", error);
    }
  });

  /**
   * @api {socket} "call_close" finish call
   * @apiName finish call
   * @apiGroup Socket
   * @apiDescription finish call
   * @apiParam {string} userId user id
   */

  socket.on("call_close", async function (param, callback) {
    try {
      if (typeof callback === "function") callback({ info: "call close received" });

      if (!param.userId) {
        logger.error(
          "call_close socketerror, code: " + Const.responsecodeCallingInvalidParamInvalidUserId,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamInvalidUserId });
        return;
      }

      logger.info("call_close param: " + JSON.stringify(param));

      const userId = param.userId;

      const userFrom = await redis.get(Const.redisKeySocketId + socket.id);

      if (!userFrom) {
        logger.error(
          `call_close - userFrom not found for socket with id: ${socket.id} on call with user: ${userId}`,
        );
      }

      if (param.callRoomId) {
        const callRoomId = param.callRoomId;

        const callLog = await redis.get(Const.redisCallLog + callRoomId);

        const newCallLog = {
          ...callLog,
          status: Const.callStatusConnected,
          callStatus: Const.callStatusEnded,
        };

        await redis.set(Const.redisCallLog + callRoomId, newCallLog);

        const callLogId = newCallLog._id.toString();
        delete newCallLog._id;

        setTimeout(() => {
          redis.del(Const.redisCallLog + callRoomId);
          CallLog.findByIdAndUpdate(callLogId, newCallLog).then(() => {
            logger.info("call_close, callLog saved to db");
          });
        }, 1);
      } else {
        await CallLog.updateStatusByCallerId(
          userFrom._id,
          Const.callStatusConnected,
          Const.callStatusEnded,
        );
      }

      socketApi.flom.emitToRoom(userId, "call_close", { callRoomId: param.callRoomId });
    } catch (error) {
      logger.error("call_close error: ", error);
    }
  });

  /**
   * @api {socket} "call_disconnected" disconnected call
   * @apiName disconnected call
   * @apiGroup Socket
   * @apiDescription disconnected call
   * @apiParam {string} userId user id
   */

  socket.on("call_disconnected", async function (param, callback) {
    try {
      if (typeof callback === "function") callback({ info: "call disconnect received" });

      if (!param.userId) {
        logger.error(
          "call_disconnected socketerror, code: " +
            Const.responsecodeCallingInvalidParamInvalidUserId,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamInvalidUserId });
        return;
      }

      logger.info("call_disconnected param: " + JSON.stringify(param));

      if (param.callRoomId) {
        const callRoomId = param.callRoomId;

        const callLog = await redis.get(Const.redisCallLog + callRoomId);

        const newCallLog = {
          ...callLog,
          status: Const.callStatusConnected,
          callStatus: Const.callStatusReconnecting,
          connectedUsers: [],
        };

        await redis.set(Const.redisCallLog + callRoomId, newCallLog);

        const callLogId = newCallLog._id.toString();
        delete newCallLog._id;

        setTimeout(() => {
          CallLog.findByIdAndUpdate(callLogId, newCallLog).then(() => {
            logger.info("call_disconnected, callLog saved to db");
          });
        }, 1);
      } else {
        await CallLog.disconnectCall(param.userId);
      }
    } catch (error) {
      logger.error("call_disconnected error: ", error);
    }
  });

  /**
   * @api {socket} "call_connected" connected call
   * @apiName connected call
   * @apiGroup Socket
   * @apiDescription connected call
   * @apiParam {string} userId user id
   */

  socket.on("call_connected", async function (param, callback) {
    try {
      if (typeof callback === "function") callback({ info: "call connected received" });

      if (!param.userId) {
        logger.error(
          "call_connected socketerror, code: " + Const.responsecodeCallingInvalidParamInvalidUserId,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamInvalidUserId });
        return;
      }

      logger.info("call_connected param: " + JSON.stringify(param));

      if (param.callRoomId) {
        const { callRoomId, userId } = param;

        const callLog = await redis.get(Const.redisCallLog + callRoomId);

        if (!callLog) {
          return;
        }

        // check if user is already connected
        const isUserConnected = (userId, connectedUsers) => connectedUsers.indexOf(userId) > -1;

        let { connectedUsers, callStatus } = callLog;
        const alreadyConnected = isUserConnected(userId, connectedUsers);

        if (!alreadyConnected) {
          connectedUsers.push(userId);
        }

        const allUsersConnected = connectedUsers.length === 2;

        if (allUsersConnected) {
          callStatus = Const.callStatusAllConnected;
        }

        const newCallLog = {
          ...callLog,
          status: Const.callStatusConnected,
          callStatus,
          connectedUsers,
        };

        await redis.set(Const.redisCallLog + callRoomId, newCallLog);

        const callLogId = newCallLog._id.toString();
        delete newCallLog._id;

        setTimeout(() => {
          CallLog.findByIdAndUpdate(callLogId, newCallLog).then(() => {
            logger.info("call_connected, callLog saved to db");
          });
        }, 1);
      } else {
        await CallLog.connectCall(param.userId);
      }
    } catch (error) {
      logger.error("call_connected error: ", error);
    }
  });

  /**
   * @api {socket} "call_status" call status
   * @apiName call status
   * @apiGroup Socket
   * @apiDescription call status
   * @apiParam {string} userId user id
   */

  socket.on("call_status", async function (param, callback) {
    try {
      if (!param.userId) {
        logger.error(
          "call_status socketerror, code: " + Const.responsecodeCallingInvalidParamInvalidUserId,
        );
        socket.emit("socketerror", { code: Const.responsecodeCallingInvalidParamInvalidUserId });
        return;
      }

      logger.info("call_status param: " + JSON.stringify(param));

      const userId = param.userId;

      const callStatus = await CallLog.findLatestCallByUserId(userId);

      if (!callStatus) {
        if (typeof callback === "function") callback({ info: "no call" });
        return;
      }

      console.log("callStatus: " + JSON.stringify(callStatus));

      const { callRoomId } = callStatus;

      const getOtherUserId = (currentUserId, callStatus) => {
        const { callerUserId, calleeUserId } = callStatus;

        if (currentUserId === callerUserId) {
          return calleeUserId;
        } else {
          return callerUserId;
        }
      };

      const otherUserId = getOtherUserId(userId, callStatus);

      const selectFromUser = {
        name: 1,
        phoneNumber: 1,
        avatar: 1,
        created: 1,
        userid: 1,
        description: 1,
        status: 1,
      };

      const findOtherUser = await User.findById(otherUserId, selectFromUser);
      if (!findOtherUser) {
        if (typeof callback === "function") callback({ info: "no call" });
        return;
      }
      const otherUser = findOtherUser.toObject();

      let callLog = null;
      // new way
      try {
        if (callRoomId) {
          callLog = await redis.get(Const.redisCallLog + callRoomId);
        }
      } catch (e) {
        logger.error("call_status error", e);
      }

      console.log("callLog: " + JSON.stringify(callLog));

      const data = {
        callStatus: callLog || callStatus,
        otherUser,
      };

      if (typeof callback === "function") callback(data);
    } catch (error) {
      logger.error("call_status error", error);
    }
  });
};

async function deleteCallByCallId(callId) {
  // find a redis key
  const keys = await redis.keys(Const.redisCallQueue + "_*_" + callId);
  // this must always 1 key, but for just in case I use iteration
  for (const key of keys) {
    await redis.del(key);
  }
}

/*
async function sendMessage(callerUserId, calleeUserId, status) {
  try {
    const findCallerResult = await User.findOne({
      _id: callerUserId,
    });
    const callerUser = findCallerResult.toObject();

    const findCalleeResult = await User.findOne({
      _id: calleeUserId,
    });
    const calleeUser = findCalleeResult.toObject();

    let chatId = "";

    if (calleeUser.created < callerUser.created) {
      chatId = Const.chatTypePrivate + "-" + calleeUser._id + "-" + callerUser._id;
    } else {
      chatId = Const.chatTypePrivate + "-" + callerUser._id + "-" + calleeUser._id;
    }

    const callLogResult = await CallLog.findOne(
      {
        callerUserId: callerUserId,
        calleeUserId: calleeUserId,
        status: status,
      },
      {},
      {
        sort: {
          created: "desc",
        },
      },
    );

    let callLog = callLogResult.toObject();
    callLog._id = callLog._id.toString();

    SendMessageLogic.send(
      {
        roomID: chatId,
        userID: callerUserId,
        type: Const.messageTypeCalling,
        localID: Utils.getRandomString(),
        attributes: {
          callLogData: callLog,
        },
      },
      (err) => {
        logger.error("CallingActionsHandler err", err);
      },
      (messageObj) => {
        logger.info("CallingActionsHandler message: ", messageObj);
      },
    );
  } catch (error) {
    logger.error("SENDING MESSAGE ERR: ", error);
  }
}
*/
