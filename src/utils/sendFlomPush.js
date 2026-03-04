const { logger } = require("#infra");
const { User } = require("#models");
const callPushService = require("./callPushService");

async function sendFlomPush({
  newUser,
  receiverUser,
  message = "message",
  messageiOs = "message iOs",
  pushType = 400,
  roomId = null,
  isMuted = false,
  senderId,
  receiverId,
  orderId = null,
}) {
  try {
    const pushTokens = [];

    if (senderId) newUser = await User.findById(senderId).lean();
    if (receiverId) receiverUser = await User.findById(receiverId).lean();

    if (receiverUser.pushToken && receiverUser.pushToken.length > 0) {
      pushTokens.push(...receiverUser.pushToken);
    }

    if (receiverUser.webPushSubscription && receiverUser.webPushSubscription.length > 0) {
      pushTokens.push(...receiverUser.webPushSubscription);
    }

    const payload = {
      from: {
        avatar: newUser.avatar,
        created: newUser.created,
        id: newUser._id.toString(),
        phoneNumber: newUser.phoneNumber,
        name: newUser.name,
      },
      message: {
        created: Date.now(),
        id: "",
        message,
        messageiOs,
        type: 1,
      },
      pushType,
      roomID: !roomId ? "1" : roomId,
      to: {
        avatar: receiverUser.avatar,
        created: receiverUser.created,
        id: receiverUser._id.toString(),
        phoneNumber: receiverUser.phoneNumber,
        name: receiverUser.name,
      },
      undeliveredCount: 1,
      mute: isMuted,
      muted: isMuted,
      phoneNumber: newUser.phoneNumber,
      ...(orderId && { orderId }),
    };

    pushTokens.forEach((pushToken) => {
      const data = {
        pushToken,
        isVoip: false,
        unreadCount: 1,
        isMuted: isMuted,
        payload: payload,
      };

      callPushService(data, receiverUser);
    });

    return;
  } catch (error) {
    logger.error("sendFlomPush", error);
    return;
  }
}

module.exports = sendFlomPush;
