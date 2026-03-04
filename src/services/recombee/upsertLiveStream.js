const { logger } = require("#infra");
const { Const } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();

async function upsertLiveStream({ liveStream, userCountryCode = null, userLocation = null }) {
  try {
    await client.send(
      new rqs.SetItemValues(
        "l_" + liveStream._id.toString(),
        {
          name: liveStream.name,
          itemType: "Live Stream",
          type: Const.recombeeLiveStreamTypesMap[liveStream.type] ?? "Unknown",
          language: liveStream.language ?? "en",
          categories: [],
          ...(userCountryCode && { countryCode: userCountryCode }),
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
          ...(userLocation && {
            latitude: userLocation.coordinates[1],
            longitude: userLocation.coordinates[0],
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

    return;
  } catch (error) {
    logger.error("Recombee, upsertLiveStream error:", error);
    return;
  }
}

module.exports = upsertLiveStream;
