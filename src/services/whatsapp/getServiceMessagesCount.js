const { logger } = require("#infra");
const { WhatsAppLog } = require("#models");
const { DateTime } = require("luxon");

async function getServiceMessagesCount() {
  try {
    const startOfMonthUTC = DateTime.now()
      .setZone("America/Santiago")
      .startOf("month")
      .toUTC()
      .toMillis();

    const count = await WhatsAppLog.countDocuments({
      waType: "service",
      direction: "outgoing",
      created: { $gte: startOfMonthUTC },
    });

    return count || 0;
  } catch (error) {
    logger.error("WhatsApp, getServiceMessagesCount, error", error);
    return 1000;
  }
}

module.exports = getServiceMessagesCount;
