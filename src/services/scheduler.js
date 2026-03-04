const schedule = require("node-schedule");
const jobs = require("../jobs");

module.exports = {
  init: () => {
    // schedule.scheduleJob("*/1 * * * *", jobs.sendTestPush);
    schedule.scheduleJob("1 */8 * * *", jobs.sendPushForUnreadMessages);
    schedule.scheduleJob("* * * * *", jobs.stopDeadLiveStreams);
    schedule.scheduleJob("1 3 * * *", jobs.syncRecombee);
    schedule.scheduleJob("1 1 * * 0", jobs.viewsCleanup);
  },
};
