const { Config, Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const Logics = require("#logics");
const { BusinessInvite } = require("#models");

async function sendBusinessInviteNotifications() {
  try {
    const invites = await BusinessInvite.find({
      "notifications.seen": false,
      expiresAt: { $gt: Date.now() },
      $or: [
        { "notifications.inAppNotificationSentAt": { $lt: Date.now() - 1000 * 60 * 60 * 12 } },
        { "notifications.inAppMessageSentAt": { $lt: Date.now() - 1000 * 60 * 60 * 12 } },
      ],
    }).lean();

    for (const invite of invites) {
      if (!invite.notifications.waSentAt) {
        // handle sending wa message
      } else if (
        !invite.notifications.smsSentAt &&
        ((invite.notifications.waSentAt < Date.now() - 1000 * 60 * 60 * 6 &&
          !invite.notifications.waSeenAt) ||
          invite.notifications.waFailed)
      ) {
        // handle sending sms
      }
    }
  } catch (error) {
    logger.error("sendTestPush", error);
  }
}

module.exports = sendBusinessInviteNotifications;
