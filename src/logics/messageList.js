const { logger, encryptionManager } = require("#infra");
const { Const } = require("#config");
const { FlomMessage, Favorite, UserContact, History } = require("#models");
const socketApi = require("../sockets/socket-api");

const populateMessages = require("./populateMessages");
const updateHistory = require("./updateHistory");

async function messageList({ userID, roomId, lastMessageId, direction, encrypt }) {
  try {
    const limit = lastMessageId != 0 ? 0 : Const.pagingLimit;
    let messages = null;

    switch (direction) {
      case Const.MessageLoadDirection.prepend:
        messages = await FlomMessage.findOldMessages(roomId, lastMessageId, Const.pagingLimit);
        break;
      case Const.MessageLoadDirection.appendAnd:
        messages = await FlomMessage.findNewMessagesCurrentInc(roomId, lastMessageId, limit);
        break;
      case Const.MessageLoadDirection.append:
        messages = await FlomMessage.findNewMessages(roomId, lastMessageId, limit);
        break;
      case Const.MessageLoadDirection.appendNoLimit:
        messages = await FlomMessage.findAllMessages(roomId, lastMessageId);
        break;
      default:
        throw new Error("Invalid message list direction: " + direction);
    }

    let chatType = roomId.split("-")[0];
    let chatId = roomId.split("-")[1];
    if (chatType == Const.chatTypePrivate && chatId == userID) chatId = roomId.split("-")[2];

    const history = await History.findOne({ userId: userID, chatType, chatId }).lean();
    messages = messages.filter(
      (msg) => msg.created > (history && history.isDeleted ? history.isDeleted : 0),
    );

    const messageIdsToNotify = [];
    const messageUpdateOperations = [];

    for (const msg of messages) {
      const seenBy = msg.seenBy || [];
      const exists = seenBy.find((s) => s.user == userID);

      if (!exists && msg.userID != userID) {
        seenBy.push({
          user: userID,
          at: Date.now(),
          version: 2,
        });

        const seen = new Set();
        const unique = seenBy.filter((u) => {
          if (seen.has(u.user)) return false;
          seen.add(u.user);
          return true;
        });

        msg.seenBy = unique;
        messageIdsToNotify.push(msg._id.toString());
        messageUpdateOperations.push({
          updateOne: {
            filter: { _id: msg._id },
            update: { $set: { seenBy: unique } },
          },
        });
      }
    }

    await FlomMessage.bulkWrite(messageUpdateOperations, { ordered: false });

    let lastMessage = null;
    messages.forEach((msg) => {
      if (!lastMessage || msg.created > lastMessage.created) {
        lastMessage = msg;
      }
    });
    if (lastMessage && lastMessage.userID != userID) {
      await updateHistory.updateLastMessageStatus({
        messageId: lastMessage._id.toString(),
        seen: lastMessage.sentTo.length == lastMessage.seenBy.length,
      });
    }

    const populatedMessages = await populateMessages(messages);
    const messagesToNotify = populatedMessages.filter((msg) =>
      messageIdsToNotify.includes(msg._id.toString()),
    );

    if (messagesToNotify.length > 0) {
      const roomID = messagesToNotify[0].roomID;
      const chatType = roomID.split("-")[0];

      // websocket notification
      if (chatType == Const.chatTypeGroup) {
        socketApi.emitToRoom(roomID, "updatemessages", messagesToNotify);
      } else if (chatType == Const.chatTypeRoom || chatType == Const.chatTypeBroadcastAdmin) {
        socketApi.emitToRoom(roomID, "updatemessages", messagesToNotify);
      } else if (chatType == Const.chatTypePrivate) {
        const splitAry = roomID.split("-");

        if (splitAry.length < 2) return;

        const user1 = splitAry[1];
        const user2 = splitAry[2];

        let toUser = null;
        let fromUser = null;

        if (user1 == userID) {
          toUser = user2;
          fromUser = user1;
        } else {
          toUser = user1;
          fromUser = user2;
        }

        socketApi.emitToRoom(toUser, "updatemessages", messagesToNotify);
      }
    }

    const uniqueUserIds = Array.from(new Set(messages.map((msg) => msg.userID)));
    const userContacts = await UserContact.find({
      userId: userID,
      contactId: { $in: uniqueUserIds },
    }).lean();
    const userContactMap = {};
    userContacts.forEach((uc) => {
      userContactMap[uc.contactId] = uc;
    });
    for (const msg of messages) {
      const contact = userContactMap[msg.userID];
      if (contact && contact.name) msg.user.name = contact.name;
    }

    const favorites = await Favorite.find({ userId: userID }).lean();
    const favoritesMessageIds = favorites.map((fav) => fav.messageId.toString());
    for (const msg of messages) {
      msg.isFavorite = favoritesMessageIds.includes(msg._id.toString()) ? 1 : 0;
    }

    await updateHistory.resetUnreadCount({ roomID: roomId, userID: userID });

    if (!encrypt) return messages;

    for (const msg of messages) {
      if (msg.type == Const.messageTypeText) {
        msg.message = encryptionManager.encryptText(msg.message);
      }
    }

    return messages;
  } catch (error) {
    logger.error("messageList error: ", error);
    return [];
  }
}

module.exports = messageList;
