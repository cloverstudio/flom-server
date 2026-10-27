const { logger } = require("#infra");
const { IdempotencyRecord } = require("#models");

async function deleteIdempotencyRecords() {
  try {
    await IdempotencyRecord.deleteMany({
      created: { $lt: Date.now() - 48 * 60 * 60 * 1000 },
    });
  } catch (error) {
    logger.error("deleteIdempotencyRecords", error);
  }
}

module.exports = deleteIdempotencyRecords;
