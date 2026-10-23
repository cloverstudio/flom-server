const { logger } = require("#infra");
const { UnexpectedError } = require("#models");

async function cleanUnexpectedErrors() {
  try {
    await UnexpectedError.deleteMany({
      created: { $lt: Date.now() - 180 * 24 * 60 * 60 * 1000 }, // older than 180 days
    });

    // No equivalent for BusinessMember, so this section can be removed
  } catch (error) {
    logger.error("cleanUnexpectedErrors", error);
  }
}

module.exports = cleanUnexpectedErrors;
