const { logger } = require("#infra");
const Utils = require("#utils");
const { Configuration } = require("#models");
const { recombee } = require("#services");

async function syncRecombee() {
  try {
    const old = await Configuration.findOneAndUpdate(
      { name: "recombee-sync-timestamp" },
      { $set: { name: "recombee-sync-timestamp", value: Date.now() } },
      {
        upsert: true,
        returnOriginal: true,
        lean: true,
      },
    );

    const timestamp = !old?.value ? 0 : old.value - 1000 * 60 * 30;

    await recombee.syncProducts(timestamp);
    await Utils.wait(300);
    await recombee.syncLiveStreams(timestamp);
    await Utils.wait(300);
    await recombee.syncUsers(timestamp);
    await Utils.wait(300);
    await recombee.syncPurchases(timestamp);
  } catch (error) {
    logger.error("syncRecombee", error);
  }
}

module.exports = syncRecombee;
