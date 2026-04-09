const { Const } = require("#config");
const Utils = require("#utils");
const { logger } = require("#infra");
const { FlomMessage, History, User, Room } = require("#models");
const socketApi = require("../socket-api");

module.exports = function (socket) {
  /**
   * @api {socket} "messageReaction" Update reaction to message
   * @apiName Send Message
   * @apiGroup Socket
   * @apiDescription Send new message by socket
   * @apiParam {string} roomID Room ID
   * @apiParam {string} userID User ID
   * @apiParam {string} type Message Type. 1:Text 2:File 3:Location
   * @apiParam {string} message Message if type == 1
   * @apiParam {string} fileID File ID if type == 2
   * @apiParam {object} location lat and lng if type == 3
   *
   */

  socket.on("messageReaction", async function (params, callback) {
    try {
      const { messageId, userId, roomId, reactionString } = params;

      if (!roomId || roomId.includes("null")) {
        console.error("roomId error - " + Const.resCodeSocketMessageReactionNoRoomId);
        return socket.emit("socketerror", { code: Const.resCodeSocketMessageReactionNoRoomId });
      }

      if (!userId) {
        console.error("userId error - " + Const.resCodeSocketMessageReactionNoUserId);
        return socket.emit("socketerror", { code: Const.resCodeSocketMessageReactionNoUserId });
      }

      if (!messageId) {
        console.error("type error - " + Const.resCodeSocketMessageReactionNoMessageId);
        return socket.emit("socketerror", { code: Const.resCodeSocketMessageReactionNoMessageId });
      }

      if (reactionString === undefined) {
        console.error("message error - " + Const.resCodeSocketMessageReactionNoReactionString);
        return socket.emit("socketerror", {
          code: Const.resCodeSocketMessageReactionNoReactionString,
        });
      }

      // find message & add/update/remove reaction

      const actionIsDelete = reactionString === "";
      let isUpdate = false;

      const message = await FlomMessage.findById(messageId).lean();
      const reactions = !message.attributes
        ? []
        : !message.attributes.reactions
        ? []
        : message.attributes.reactions.list;
      const newReaction = {
        emojiString: reactionString,
        userId,
        created: Date.now(),
        modified: Date.now(),
      };

      const reactionSender = await User.findById(userId).lean();
      const messageSender = await User.findById(message.userID).lean();

      let newReactionList;
      if (actionIsDelete) {
        newReactionList = reactions.filter((reaction) => reaction.userId !== userId);
      } else {
        reactions.forEach((reaction) => {
          if (reaction.userId === userId) {
            isUpdate = true;
            reaction.emojiString = reactionString;
            reaction.modified = Date.now();
          }
        });

        if (isUpdate) newReactionList = reactions;
        else newReactionList = [...reactions, newReaction];
      }

      const attributesForNoAttrInMessage = {
        reactions: { list: newReactionList },
      };

      let updatedMessage = !message.attributes
        ? await FlomMessage.findByIdAndUpdate(
            messageId,
            { attributes: attributesForNoAttrInMessage },
            {
              new: true,
            },
          )
        : await FlomMessage.findByIdAndUpdate(
            messageId,
            { "attributes.reactions.list": newReactionList },
            {
              new: true,
            },
          );
      updatedMessage = updatedMessage.toObject();
      updatedMessage._id = updatedMessage._id.toString();

      // update chat histories

      const temp = roomId.split("-");
      const chatType = +temp[0];
      let isGroupChat = false,
        chatId,
        user1Id,
        user2Id;
      if (temp.length === 2) {
        isGroupChat = true;
        chatId = temp[1];
      } else if (temp.length === 3) {
        user1Id = temp[1];
        user2Id = temp[2];
      } else {
        console.error("invalid roomId error - " + Const.resCodeSocketMessageReactionInvalidRoomId);
        return socket.emit("socketerror", {
          code: Const.resCodeSocketMessageReactionInvalidRoomId,
        });
      }

      let chatUserIds = null,
        roomInfo = undefined;
      if (isGroupChat) {
        const room = await Room.findById(chatId).lean();

        const thumbURL = !room.avatar
          ? undefined
          : "/api/v2/avatar/room/" + room.avatar.thumbnail.nameOnServer;

        roomInfo = {
          id: room._id.toString(),
          name: room.name,
          thumb: thumbURL,
          created: room.created,
          owner: room.owner,
        };

        if (room.avatar) roomInfo.avatar = room.avatar;

        chatUserIds = [...room.users, ...room.admins];
      } else {
        chatUserIds = [user1Id, user2Id];
      }

      const histories = isGroupChat
        ? await History.find({ chatId }).lean()
        : await History.find({
            $or: [
              { userId: user1Id, chatId: user2Id },
              { userId: user2Id, chatId: user1Id },
            ],
          }).lean();

      const promiseList = [];

      if (actionIsDelete) {
        const oldLastMessage = await FlomMessage.findOne({ roomID: roomId })
          .sort({ created: -1 })
          .lean();

        const lastUser = await User.findOne({ _id: oldLastMessage.userID }).lean();

        histories.forEach((history) => {
          const lastMessage = {
            messageId: oldLastMessage._id.toString(),
            message: oldLastMessage.message,
            created: oldLastMessage.created,
            type: oldLastMessage.type,
            sentTo: oldLastMessage.sentTo,
            reaction: oldLastMessage.reaction,
          };
          const lastUpdateUser = {
            _id: lastUser._id.toString(),
            bankAccounts: lastUser.bankAccounts,
            name: lastUser.name,
            organizationId: lastUser.organizationId,
            created: lastUser.created,
            phoneNumber: lastUser.phoneNumber,
            description: lastUser.description,
          };
          const lastUpdate = lastMessage.created;

          promiseList.push(
            History.updateOne(
              { _id: history._id.toString() },
              { lastMessage, lastUpdate, lastUpdateUser },
            ),
          );
        });

        await Promise.all(promiseList);
      } else {
        histories.forEach((history) => {
          if (isUpdate) newReaction.created = history.lastMessage?.reaction?.created ?? Date.now();

          const lastMessage = {
            messageId: message._id.toString(),
            message: message.message,
            created: Date.now(),
            type: message.type,
            sentTo: message.sentTo,
            reaction: newReaction,
          };
          const lastUpdate = Date.now();
          const lastUpdateUser = {
            _id: reactionSender._id.toString(),
            bankAccounts: reactionSender.bankAccounts,
            name: reactionSender.name,
            organizationId: reactionSender.organizationId,
            created: reactionSender.created,
            phoneNumber: reactionSender.phoneNumber,
            description: reactionSender.description,
          };

          promiseList.push(
            History.updateOne(
              { _id: history._id.toString() },
              { lastMessage, lastUpdate, lastUpdateUser },
            ),
          );
        });

        await Promise.all(promiseList);

        const receiverIds = [...message.sentTo, message.userID].filter((id) => id !== userId);
        const receivers = await User.find({ _id: { $in: receiverIds } }).lean();

        for (const receiver of receivers) {
          if (!receiver.pushToken) {
            console.log(
              "MessageReactionHandler, receiver missing push token array: " +
                receiver._id.toString() +
                " " +
                receiver.phoneNumber,
            );
            continue;
          }

          await Utils.sendPushNotifications({
            pushTokens: receiver.pushToken,
            pushType: Const.pushTypeMessageReactionSent,
            info: {
              pushType: Const.pushTypeMessageReactionSent,
              roomId,
              room: roomInfo,
              message: "Reaction",
              Message: {
                id: updatedMessage._id.toString(),
                message: updatedMessage.message,
                type: updatedMessage.type,
                created: updatedMessage.created,
                senderName: reactionSender.name,
                senderPhoneNumber: reactionSender.phoneNumber,
                receiverName: receiver.name,
                receiverPhoneNumber: receiver.phoneNumber,
                attributes: updatedMessage.attributes,
              },
              from: {
                id: reactionSender._id.toString(),
                name: reactionSender.name,
                created: reactionSender.created,
                phoneNumber: reactionSender.phoneNumber,
                avatar: reactionSender.avatar?.picture,
                thumb: reactionSender.avatar?.thumbnail,
              },
              to: {
                id: receiver._id.toString(),
                name: receiver.name,
                created: receiver.created,
                phoneNumber: receiver.phoneNumber,
                avatar: receiver.avatar?.picture,
                thumb: receiver.avatar?.thumbnail,
              },
            },
          });
        }
      }

      updatedMessage.user = messageSender;

      for (const chatUserId of chatUserIds) {
        socketApi.emitToRoom(chatUserId, "updatemessages", [updatedMessage]);
      }

      if (typeof callback === "function") callback(updatedMessage);
    } catch (error) {
      logger.error("messageReaction", error);
      socket.emit("socketerror", { code: Const.resCodeSocketUnknownError });
      return;
    }
  });
};
