const { logger } = require("#infra");
const { History } = require("#models");

async function totalUnreadCount(userId) {
  try {
    const res = await History.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$userId", count: { $sum: "$unreadCount" } } },
    ]);

    return res[0]?.count ?? 0;
  } catch (error) {
    logger.error("totalUnreadCount error: ", error);
    return;
  }
}

module.exports = totalUnreadCount;
