const { logger } = require("#infra");
const { AccessRecord } = require("#models");

async function deleteAccessRecords() {
  try {
    await AccessRecord.deleteMany({
      created: { $lt: Date.now() - 60 * 24 * 60 * 60 * 1000 },
    });
  } catch (error) {
    logger.error("deleteAccessRecords", error);
  }
}

module.exports = deleteAccessRecords;
