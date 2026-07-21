const { Config, Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const Logics = require("#logics");
const { BusinessInvite, Business, User } = require("#models");

async function sendBusinessInviteNotifications() {
  try {
    if (Config.env !== "production") {
      logger.info("sendBusinessInviteNotifications skipped, not in production");
      return;
    }

    logger.info("sendBusinessInviteNotifications started");
    const invites = await BusinessInvite.find({
      status: "pending",
      smsSent: false,
      expiresAt: { $gt: Date.now() },
      created: { $lt: Date.now() - 8 * 60 * 60 * 1000 }, // only find invites created more than 8 hours ago
    }).lean();

    for (const invite of invites) {
      const business = await Business.findById(invite.businessId).lean();
      const invitedBy = await User.findById(invite.invitedById, { name: 1, userName: 1 }).lean();

      if (!business || !invitedBy || !invite.phoneNumber) {
        logger.error(
          `sendBusinessInviteNotifications, invite ${invite._id.toString()} has invalid business or invitedBy or phoneNumber`,
        );
        continue;
      }

      const text = `${invitedBy.name || invitedBy.userName} added you to help at ${
        business.name
      } on Flom - open the app to set up:\n\nhttps://flom.app/business_invite?t=${invite.token}`;

      await Utils.sendSMSv2({
        phoneNumber: invite.phoneNumber,
        message: text,
        type: "business_invite",
      });

      await Utils.sleep(1000); // sleep 1 second between SMS to avoid rate limiting
    }

    await BusinessInvite.updateMany(
      { _id: { $in: invites.map((invite) => invite._id) } },
      { $set: { smsSent: true } },
    );
  } catch (error) {
    logger.error("sendBusinessInviteNotifications", error);
  }
}

module.exports = sendBusinessInviteNotifications;
