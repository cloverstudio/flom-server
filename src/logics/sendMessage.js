const { logger, encryptionManager, redis } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, FlomMessage, Room, Group, BlockedChatGPTCountry } = require("#models");
const socketApi = require("../sockets/socket-api");

const notifyNewMessage = require("./notifyNewMessage");
const updateHistory = require("./updateHistory");
const permissionLogic = require("./permissionLogic");

async function sendMessage(param) {
  try {
    if (!param.isRecursiveCall) param.isRecursiveCall = false;
    const userID = param.userID;
    const roomID = param.roomID;

    if (roomID == "2-59c944e75fa2d37909366d0c") {
      logger.info("Not send message because of room id: 2-59c944e75fa2d37909366d0c");
      throw new Error("Not send message because of room id: 2-59c944e75fa2d37909366d0c");
    }

    const result = {};

    if (
      (param.type == Const.messageTypeText ||
        param.type == Const.messageTypeProduct ||
        param.type == Const.messageTypeShop ||
        param.type == Const.messageTypeAddUserToRoom) &&
      !param.plainTextMessage
    ) {
      param.message = encryptionManager.decryptText(param.message);
    }

    const user = await User.findById(userID).lean();
    if (!user) {
      throw new Error("User not found: " + userID);
    }
    result.user = user;

    const msgType = roomID.split("-");

    let receiver = null;
    if (msgType[0] == Const.chatTypePrivate) {
      let msgReceiver;
      msgType[1] === userID ? (msgReceiver = msgType[2]) : (msgReceiver = msgType[1]);

      if (!msgReceiver) return done(Const.responsecodeUnknownError);

      receiver = await User.findById(msgReceiver, { token: 0 }).lean();
      if (!receiver) {
        throw new Error("Receiver user not found: " + msgReceiver);
      }

      result.receiverUser = receiver;
      result.receiverPhoneNumber = receiver.phoneNumber;
      result.receiverName = receiver.name;
      if (result.user) {
        result.senderPhoneNumber = result.user.phoneNumber;
        result.senderName = result.user.name;
      }
    }

    if (param.localID) {
      const msg = await FlomMessage.findOne({ localID: param.localID }).lean();
      if (msg) {
        logger.info("Message with the same localID already exists: " + param.localID);
        return { origMessageObj: {} };
      }
    }

    const messageTargetTypeAry = roomID.split("-");

    if (messageTargetTypeAry.length < 2) {
      throw new Error("check permission::invalid room id: " + messageTargetTypeAry);
    }

    const messageTargetType = messageTargetTypeAry[0];
    if (messageTargetType != Const.chatTypePrivate) {
      await permissionLogic.checkPermissionByChatId(userID, roomID);
    }

    if (messageTargetType == Const.chatTypePrivate) {
      let userIdTo = messageTargetTypeAry[1];
      if (userIdTo == userID) userIdTo = messageTargetTypeAry[2];
      const toUser = await User.findById(userIdTo, { token: 0 }).lean();

      if (!toUser) {
        throw new Error("check block::no user found - userIdTo: " + userIdTo);
      }

      const isBlocked = toUser.blocked.includes(userID);
      if (isBlocked) {
        throw new Error("User is blocked");
      }
    }

    const chatType = roomID.split("-")[0];
    let chatId = roomID.split("-")[1];

    switch (Number(chatType)) {
      case Const.chatTypePrivate:
        if (chatId == userID) chatId = roomID.split("-")[2];
        result.sentTo = [chatId];
        break;
      case Const.chatTypeRoom:
      case Const.chatTypeBroadcastAdmin:
        const findRoom = await Room.findById(chatId).lean();
        if (!findRoom) {
          throw new Error("room model::no room found - chatId: " + chatId);
        }
        result.sentTo = findRoom.users.filter((uid) => uid != userID);
        break;
      case Const.chatTypeGroup:
        const findGroup = await Group.findById(chatId).lean();
        if (!findGroup) {
          throw new Error("group model::no group found - chatId: " + chatId);
        }
        result.sentTo = findGroup.users.filter((uid) => uid != userID);
        break;
    }

    const objMessage = {
      remoteIpAddress: param.ipAddress,
      userID: userID,
      roomID: param.roomID,
      message: param.message,
      localID: param.localID,
      type: param.type,
      file: null,
      attributes: param.attributes,
      created: param.created || Date.now(),
      sentTo: result.sentTo,
    };

    if (result.receiverPhoneNumber) objMessage.receiverPhoneNumber = result.receiverPhoneNumber;
    if (result.receiverName) objMessage.receiverName = result.receiverName;
    if (result.senderPhoneNumber) objMessage.senderPhoneNumber = result.senderPhoneNumber;
    if (result.senderName) objMessage.senderName = result.senderName;
    if (result.user) {
      objMessage.user = result.user._id;
    }
    if (param.location) {
      objMessage.location = param.location;
    }
    if (param.file) {
      objMessage.file = {
        file: {
          id: param.file.file.id,
          name: param.file.file.name,
          size: param.file.file.size,
          mimeType: param.file.file.mimeType,
        },
      };
      if (param.file.file.duration) objMessage.file.file.duration = param.file.file.duration;
      if (param.file.thumb) {
        objMessage.file.thumb = {
          id: param.file.thumb.id,
          name: param.file.thumb.name,
          size: param.file.thumb.size,
          mimeType: param.file.thumb.mimeType,
        };
      }
    }

    const newMessage = await FlomMessage.create(objMessage);
    result.message = newMessage.toObject();

    if (roomID.includes(Const.FatAiObjectId) && !param.isRecursiveCall) {
      const chatId = Utils.chatIdByUser(result.user, result.receiverUser);
      socketApi.flom.emitToRoom(result.user._id.toString(), "typing", {
        userID: Const.FatAiObjectId,
        roomID: chatId,
        type: 1,
        userName: "FatAi",
      });
      //check if ChatGPT is banned in users country

      const userCountryCode = Utils.getCountryCodeFromPhoneNumber({
        phoneNumber: result.user.phoneNumber,
      });
      const isCountryBlocked = await BlockedChatGPTCountry.findOne({
        countryCode: userCountryCode,
      }).lean();
      if (
        param.message === Const.thumbUpFatAiContinueResponse ||
        param.message.toLowerCase() === "yes"
      ) {
        param.message =
          "Continue where you left off but without repeating what you previously wrote and without apologizing, just continue the writing.";
      }
      if (isCountryBlocked) {
        const messageParams = {
          roomID: chatId,
          userID: result.receiverUser._id.toString(),
          type: Const.messageTypeText,
          message: Const.FatAiBlockedCountryMessage,
          plainTextMessage: true,
          isRecursiveCall: true,
        };
        socketApi.flom.emitToRoom(result.user._id.toString(), "typing", {
          userID: Const.FatAiObjectId,
          roomID: chatId,
          type: 0,
          userName: "FatAi",
        });

        sendMessage(messageParams);
      } else {
        const responseFromGPT = await Utils.callChatGPTApi(
          param.message,
          result.user.phoneNumber,
          result.receiverUser.phoneNumber,
          true,
        );
        if (responseFromGPT.tokenUsage === Const.FatAiMaxTokens) {
          responseFromGPT.message = responseFromGPT.message + "\n\n" + Const.FatAiContinueMessage;
        }
        const messageParams = {
          roomID: chatId,
          userID: result.receiverUser._id.toString(),
          type: Const.messageTypeText,
          message: responseFromGPT.message,
          plainTextMessage: true,
          isRecursiveCall: true,
        };
        socketApi.flom.emitToRoom(result.user._id.toString(), "typing", {
          userID: Const.FatAiObjectId,
          roomID: chatId,
          type: 0,
          userName: "FatAi",
        });

        sendMessage(messageParams);
      }
    }

    if (
      roomID.includes(Const.FlomTeamObjectId) &&
      !param.isRecursiveCall &&
      result.receiverUser.phoneNumber === Const.FlomTeamPhoneNumber
    ) {
      const flomTeamCurrentChat = await redis.get("flom_team_current_chat");

      if (!flomTeamCurrentChat?.includes(result.user._id.toString())) {
        const chatId = Utils.chatIdByUser(result.user, result.receiverUser);
        socketApi.flom.emitToRoom(result.user._id.toString(), "typing", {
          userID: Const.FlomTeamObjectId,
          roomID: chatId,
          type: 1,
          userName: "Flom",
        });

        const responseFromGPT = await Utils.getGPTAssistantResponse(
          Const.FlomTeamAssistantId,
          result.user._id.toString(),
          param.message,
        );
        const messageParams = {
          roomID: chatId,
          userID: result.receiverUser._id.toString(),
          type: Const.messageTypeText,
          message: responseFromGPT,
          plainTextMessage: true,
          isRecursiveCall: true,
        };
        socketApi.flom.emitToRoom(result.user._id.toString(), "typing", {
          userID: Const.FlomTeamObjectId,
          roomID: chatId,
          type: 0,
          userName: "Flom",
        });

        if (responseFromGPT.toLowerCase().includes("support")) {
          messageParams.message = Const.FlomTeamTicketRedirectedMessage;
        }

        sendMessage(messageParams);

        if (responseFromGPT.toLowerCase().includes("support")) {
          const userForSupport = await User.findById(result.user._id.toString()).lean();
          if (!userForSupport || !userForSupport.token || userForSupport.token.length === 0) {
            throw new Error(
              "User token not found for Flom team support: " + result.user._id.toString(),
            );
          }

          Utils.sendRequest({
            method: "POST",
            url: `http://localhost:${Config.port.api}/api/v2/support`,
            headers: {
              "Content-Type": "application/json",
              "access-token": userForSupport.token[0].token,
            },
            body: {
              type: "flom_team_support",
              email: result.user.email,
              description:
                param.message +
                " " +
                Config.webClientUrl +
                "/chat/1-" +
                Const.FlomTeamObjectId +
                "-" +
                userForSupport._id.toString(),
            },
          });
        }
      }
    }

    const resp = await FlomMessage.populateMessages(result.message);

    if (resp && resp[0]) {
      resp[0].localID = "";
      resp[0].deleted = 0;
      if (param.localID) resp[0].localID = param.localID;

      if (resp[0].type == Const.messageTypeText) {
        const encryptedMessage = encryptionManager.encryptText(resp[0].message);
        resp[0].message = encryptedMessage;
      }
      result.messagePopulated = resp[0];

      await updateHistory.updateByMessage(resp[0]);
      await notifyNewMessage(resp[0], param);

      return result.messagePopulated;
    } else {
      await updateHistory.updateByMessage(result.message);
      const user = await User.findById(userID, User.getDefaultResponseFields()).lean();
      result.message.user = user;
      return result.message;
    }
  } catch (error) {
    logger.error("sendMessage error: ", error);
    throw new Error(error.message);
    // return null;
  }
}

module.exports = sendMessage;
