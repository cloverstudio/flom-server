const { Const, Config } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { LiveStream, FlomMessage } = require("#models");
const { recombee } = require("#services");

async function stopDeadLiveStreams() {
  try {
    const activeStreams = await LiveStream.find({ isActive: true }).lean();

    if (activeStreams.length === 0) return;

    const endStatuses = "finished,error,failed";

    for (const stream of activeStreams) {
      await Utils.wait(1);

      const liveStreamId = stream._id.toString();
      const isTooLong = Date.now() - stream.startTimeStamp > 1000 * 60 * 60 * 3;

      let res;

      const url = !stream.domain
        ? `${Config.antMediaBaseUrl}/v2/broadcasts/${liveStreamId}`
        : `https://${stream.domain}/WebRTCAppEE/rest/v2/broadcasts/${liveStreamId}`;

      try {
        res = await Utils.sendRequest({ method: "GET", url });
      } catch (error) {
        res = {};
      }

      const { status = null } = res || {};

      if (!status || endStatuses.includes(status) || isTooLong) {
        if (isTooLong) {
          const url2 = !stream.domain
            ? `${Config.antMediaBaseUrl}/v2/broadcasts/${liveStreamId}/stop`
            : `https://${stream.domain}/WebRTCAppEE/rest/v2/broadcasts/${liveStreamId}/stop`;

          let res2;
          try {
            res2 = await Utils.sendRequest({ method: "POST", url: url2 });
          } catch (error) {
            res2 = {};
          }
        }

        const updated = await LiveStream.findByIdAndUpdate(
          liveStreamId,
          { isActive: false, endTimeStamp: Date.now() },
          { new: true, lean: true },
        );

        await FlomMessage.updateMany(
          { type: Const.messageTypeNewLiveStream, "attributes.liveStream._id": liveStreamId },
          {
            $set: {
              "attributes.liveStream.endTimeStamp": Date.now(),
              "attributes.liveStream.isActive": false,
            },
          },
        );

        await recombee.upsertLiveStream({ liveStream: updated });
      }
    }
  } catch (error) {
    logger.error("stopDeadLiveStreams", error);
  }
}

module.exports = stopDeadLiveStreams;
