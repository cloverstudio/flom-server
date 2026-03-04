const { logger } = require("#infra");
const { Const } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();
const { LiveStream } = require("#models");

async function syncLiveStreams(timestamp = 0) {
  try {
    logger.info("Recombee, syncLiveStreams, attempting to syncLiveStreams...");

    const streams = await LiveStream.aggregate([
      { $match: { created: { $gt: timestamp } } },
      { $addFields: { userIdObj: { $toObjectId: "$userId" } } },
      {
        $lookup: {
          from: "users",
          localField: "userIdObj",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);

    let count = 0;
    let requests = [];

    for (let i = 0; i < streams.length; i++) {
      const liveStream = streams[i];
      const user = liveStream.user[0] ?? {};

      requests.push(
        new rqs.SetItemValues(
          "l_" + liveStream._id.toString(),
          {
            name: liveStream.name,
            itemType: "Live Stream",
            type: Const.recombeeLiveStreamTypesMap[liveStream.type] ?? "Unknown",
            language: liveStream.language ?? "en",
            categories: [],
            countryCode: user.countryCode ?? null,
            created: new Date(liveStream.created).toISOString(),
            ...(liveStream.tags && {
              tags: liveStream.tags.split(" ").map((tag) => tag.replace("#", "")),
            }),
            ...(liveStream.linkedProductTags && {
              linkedProductTags: liveStream.linkedProductTags
                .split(" ")
                .map((tag) => tag.replace("#", "")),
            }),
            isAvailable: liveStream.isActive ?? false,
            appropriateForKids: liveStream.appropriateForKids ?? false,
            ownerId: liveStream.userId,
            visibility: liveStream.visibility ?? "public",
            tribeIds: liveStream.tribeIds ?? [],
            communityIds: liveStream.communityIds ?? [],
            ...(user.location && {
              latitude: user.location.coordinates[1],
              longitude: user.location.coordinates[0],
            }),
            startTime: !liveStream.startTimeStamp
              ? null
              : new Date(liveStream.startTimeStamp).toISOString(),
            endTime: !liveStream.endTimeStamp
              ? null
              : new Date(liveStream.endTimeStamp).toISOString(),
          },
          { cascadeCreate: true },
        ),
      );
      count++;

      if (requests.length >= 950 || i === streams.length - 1) {
        try {
          const response = await client.send(new rqs.Batch(requests));

          for (let res of response) {
            if (res.status >= 400) {
              logger.error("Error syncing livestream to Recombee:", res);
            }
          }
        } catch (error) {
          logger.error("Recombee, item syncLiveStreams error:", error);
        }

        logger.info("Recombee, syncLiveStreams, processed items: ", count);
        requests = [];
        count = 0;

        await sleep(5); // To avoid rate limits
      }
    }
  } catch (error) {
    logger.error("Recombee, syncLiveStreams error:", error);
    return;
  }
}

function sleep(sec) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    }, sec * 1000);
  });
}

module.exports = syncLiveStreams;
