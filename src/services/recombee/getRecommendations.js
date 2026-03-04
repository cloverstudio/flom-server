const { logger } = require("#infra");
const { Const } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();

async function getRecommendations({
  userId,
  count = Const.newPagingRows,
  scenario = null,
  filter = null,
  booster = null,
}) {
  try {
    const response = await client.send(
      new rqs.RecommendItemsToUser(userId, count, {
        ...(scenario && { scenario }),
        filter:
          `('isAvailable' == true) and ('ownerId' != "${userId}")` +
          (!filter ? "" : ` and ${filter}`),
        ...(booster && { booster }),
        returnProperties: false,
      }),
    );

    return response;
  } catch (error) {
    logger.error("Recombee, getRecommendations error:", error);
    return { recomms: [], recommId: null };
  }
}

module.exports = getRecommendations;
