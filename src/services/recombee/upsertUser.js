const { logger } = require("#infra");
const { countries } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();

async function upsertUser(user) {
  try {
    user.languages = [user.deviceLanguage ?? "en"];
    if (countries[user.countryCode]) {
      user.languages.push(...countries[user.countryCode].languages);
    }

    await client.send(
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
        },
        { cascadeCreate: true },
      ),
    );

    return;
  } catch (error) {
    logger.error("Recombee, upsertUser error:", error);
    return;
  }
}

module.exports = upsertUser;
