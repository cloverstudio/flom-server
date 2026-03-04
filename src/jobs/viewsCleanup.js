const { logger } = require("#infra");
const { Configuration, View } = require("#models");

async function viewsCleanup() {
  try {
    const currentDate = Date.now();
    const daysCleanupPeriod = await Configuration.findOne(
      { name: "daysCleanupPeriod" },
      { value: 1 }
    ).lean();
    const daysCleanupPeriodInMs = daysCleanupPeriod.value * 24 * 60 * 60 * 1000;

    await View.deleteMany({ created: { $lt: currentDate - daysCleanupPeriodInMs } });
    logger.notice("View table records older than 180 days deleted!");
  } catch (error) {
    logger.error("viewsCleanup", error);
  }
}

module.exports = viewsCleanup;
