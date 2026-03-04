const { Config, Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { User, History } = require("#models");

async function sendPushForUnreadMessages() {
  try {
    const usersToNotify = await User.find({
      $and: [
        { lastActive: { $exists: true } },
        { lastActive: { $gt: Date.now() - Const.dayInMs * 30 } },
        { "isDeleted.value": false },
      ],
    }).lean();

    if (usersToNotify.length === 0) return;

    const userIds = usersToNotify.map((user) => user._id.toString());

    const flomAgent = await User.findById(Config.flomSupportUserId).lean();

    const unreadCounts = await History.aggregate([
      {
        $match: {
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: "$unreadCount" },
        },
      },
    ]);

    const countMap = {};

    for (const count of unreadCounts) {
      const id = count._id.toString();
      const unread = count.count;
      countMap[id] = unread;
    }

    for (const user of usersToNotify) {
      const unreadCount = countMap[user._id.toString()];

      if (unreadCount && unreadCount > 0) {
        await Utils.wait(0.2);

        const message = Const.unreadMessagesPushMessage.replace("[Number]", `${unreadCount}`);

        await Utils.sendFlomPush({
          newUser: flomAgent,
          receiverUser: user,
          message: message,
          messageiOs: message,
          pushType: Const.pushTypeUnreadCount,
          isMuted: true,
        });
      }
    }
  } catch (error) {
    logger.error("sendPushForUnreadMessages", error);
  }
}

module.exports = sendPushForUnreadMessages;
