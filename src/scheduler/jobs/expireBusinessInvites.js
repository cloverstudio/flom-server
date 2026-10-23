const { logger } = require("#infra");
const { BusinessInvite, BusinessMember } = require("#models");

async function expireBusinessInvites() {
  try {
    const invites = await BusinessInvite.find({
      status: "pending",
      expiresAt: { $lt: Date.now() },
    }).lean();

    await BusinessInvite.updateMany(
      { _id: { $in: invites.map((invite) => invite._id) } },
      { status: "expired" },
    );

    await BusinessMember.updateMany(
      { inviteId: { $in: invites.map((invite) => invite._id) } },
      { status: "invite_expired" },
    );
  } catch (error) {
    logger.error("expireBusinessInvites", error);
  }
}

module.exports = expireBusinessInvites;
