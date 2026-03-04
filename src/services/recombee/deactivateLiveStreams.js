const { logger } = require("#infra");
const { client, rqs } = require("./client").getClientAndRequest();

async function deactivateLiveStreams({ liveStreams = [] }) {
  try {
    if (!liveStreams || liveStreams.length === 0) return;

    const requests = liveStreams.map((l) => {
      return new rqs.SetItemValues(
        "l_" + l._id.toString(),
        {
          isAvailable: false,
          endTime: !l.endTimeStamp
            ? new Date().toISOString()
            : new Date(l.endTimeStamp).toISOString(),
        },
        { cascadeCreate: true },
      );
    });
    await client.send(new rqs.Batch(requests));

    return;
  } catch (error) {
    logger.error("Recombee, deactivateLiveStreams error:", error);
    return;
  }
}

module.exports = deactivateLiveStreams;
