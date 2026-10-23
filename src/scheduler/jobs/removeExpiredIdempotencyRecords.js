const { logger } = require("#infra");
const { IdempotencyRecord } = require("#models");

async function removeExpiredIdempotencyRecords() {
  try {
    await IdempotencyRecord.deleteMany({
      created: { $lt: Date.now() - 48 * 60 * 60 * 1000 },
    });
  } catch (error) {
    logger.error("removeExpiredIdempotencyRecords", error);
  }
}

module.exports = removeExpiredIdempotencyRecords;
