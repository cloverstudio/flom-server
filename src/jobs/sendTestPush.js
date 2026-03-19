const { Config, Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { User, History } = require("#models");

module.exports = async () => {
  try {
    const user = await User.findById("641d9c333478cf0d6a500547").lean();

    console.log(user.userName);

    const flomAgent = await User.findById(Config.flomSupportAgentId).lean();

    console.log(flomAgent.userName);

    const unreadCount = (
      await History.aggregate([
        {
          $match: {
            userId: "641d9c333478cf0d6a500547",
          },
        },
        {
          $group: {
            _id: "$userId",
            count: { $sum: "$unreadCount" },
          },
        },
      ])
    )[0].count;

    console.log(unreadCount);

    if (unreadCount && unreadCount > 0) {
      const message = Const.unreadMessagesPushMessage.replace("[Number]", `${unreadCount}`);

      console.log(message);

      await Utils.sendFlomPush({
        newUser: flomAgent,
        receiverUser: user,
        message: message,
        messageiOs: message,
        pushType: Const.pushTypeUnreadCount,
      });
    }
  } catch (error) {
    logger.error("sendTestPush", error);
  }
};
