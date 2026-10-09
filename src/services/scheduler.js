const { redis } = require("#infra");
const schedule = require("node-schedule");
const jobs = require("../jobs");

function wrapper(fn, jobName) {
  return async () => {
    try {
      const now = new Date();
      const timestamp = now.toISOString();

      const key = `scheduler:${jobName}:${timestamp.slice(0, -5)}`;

      console.log(`Acquiring lock for job ${jobName} with key ${key}`);

      const lock = await redis.set(key, "locked", { EX: 45, NX: true });
      if (!lock) {
        console.log(`Job ${jobName} is already running, skipping execution.`);
        return;
      }

      console.log(`Lock acquired for job ${jobName}, executing...`);
      await fn();
      await redis.del(key);
    } catch (error) {
      console.error(`Scheduler error for job ${jobName}`, error);
    }
  };
}

module.exports = {
  init: () => {
    schedule.scheduleJob(
      "1 */8 * * *",
      wrapper(jobs.sendPushForUnreadMessages, "sendPushForUnreadMessages"),
    );
    schedule.scheduleJob("* * * * *", wrapper(jobs.stopDeadLiveStreams, "stopDeadLiveStreams"));
    schedule.scheduleJob("1 3 * * *", wrapper(jobs.syncRecombee, "syncRecombee"));
    schedule.scheduleJob("1 1 * * 0", wrapper(jobs.viewsCleanup, "viewsCleanup"));
    schedule.scheduleJob("15 4 * * *", wrapper(jobs.updateWhatsAppPrices, "updateWhatsAppPrices"));
    schedule.scheduleJob(
      "10 */2 * * *",
      wrapper(jobs.expireBusinessInvites, "expireBusinessInvites"),
    );
    schedule.scheduleJob(
      "35 * * * *",
      wrapper(jobs.sendBusinessInviteNotifications, "sendBusinessInviteNotifications"),
    );
    schedule.scheduleJob(
      "1 6 */2 * *",
      wrapper(jobs.removeExpiredIdempotencyRecords, "removeExpiredIdempotencyRecords"),
    );
    schedule.scheduleJob("1 0 * * 0", wrapper(jobs.cleanUnexpectedErrors, "cleanUnexpectedErrors"));
  },
};
