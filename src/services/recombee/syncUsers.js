const { logger } = require("#infra");
const { countries } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();
const { User } = require("#models");

async function syncUsers(timestamp = 0) {
  try {
    logger.info("Recombee, syncUsers, attempting to syncUsers...");

    const usersToSync = await User.aggregate([
      {
        $match: { modified: { $gt: timestamp } },
      },
      {
        $lookup: {
          from: "tags",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
            { $sort: { interactions: -1 } },
            { $limit: 10 },
          ],
          as: "preferredTags",
        },
      },
      {
        $lookup: {
          from: "categories",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
            { $sort: { interactions: -1 } },
            { $limit: 10 },
          ],
          as: "preferredCategories",
        },
      },
    ]);

    let count = 0;
    let requests = [];

    for (let i = 0; i < usersToSync.length; i++) {
      const user = usersToSync[i];

      user.languages = [user.deviceLanguage ?? "en"];
      if (countries[user.countryCode]) {
        user.languages.push(...countries[user.countryCode].languages);
      }

      requests.push(
        new rqs.SetUserValues(
          user._id.toString(),
          {
            userName: user.userName,
            countryCode: user.countryCode,
            languages: Array.from(new Set(user.languages)),
            ...(user.location && {
              latitude: user.location.coordinates[1],
              longitude: user.location.coordinates[0],
            }),
            ...(user.businessCategory && { businessCategory: user.businessCategory.name }),
            ...(user.preferredTags.length > 0 && {
              preferredTags: user.preferredTags.map((t) => t.tag),
            }),
            ...(user.preferredCategories.length > 0 && {
              preferredCategories: user.preferredCategories.map((t) => t.category),
            }),
          },
          { cascadeCreate: true },
        ),
      );
      count++;

      if (requests.length >= 950 || i === usersToSync.length - 1) {
        try {
          const response = await client.send(new rqs.Batch(requests));

          for (let res of response) {
            if (res.status >= 400) {
              logger.error("Error syncing user to Recombee:", res);
            }
          }
        } catch (error) {
          logger.error("Recombee, user syncUsers error:", error);
        }
        logger.info("Recombee, syncUsers, processed users: ", count);
        requests = [];
        count = 0;

        await sleep(5); // To avoid rate limits
      }
    }
  } catch (error) {
    logger.error("Recombee, syncUsers error:", error);
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

module.exports = syncUsers;
