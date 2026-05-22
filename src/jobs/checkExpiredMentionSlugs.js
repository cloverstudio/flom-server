const { logger } = require("#infra");
const { User } = require("#models");

async function checkExpiredMentionSlugs() {
  try {
    await User.updateMany(
      { "whatsApp.oldMentionSlugExpiresAt": { $lt: Date.now() } },
      { $unset: { "whatsApp.oldMentionSlug": "", "whatsApp.oldMentionSlugExpiresAt": "" } },
    );

    return;
  } catch (error) {
    logger.error("Error checking expired mention slugs:", error);
  }
}

module.exports = checkExpiredMentionSlugs;
