const { logger } = require("#infra");
const { Const } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();

async function getNextRecommendations({ recommId, count = Const.newPagingRows }) {
  try {
    const response = await client.send(
      new rqs.RecommendNextItems(recommId, count, { returnProperties: false }),
    );

    return response;
  } catch (error) {
    logger.error("Recombee, getNextRecommendations error:", error);
    return { recomms: [], recommId: null };
  }
}

module.exports = getNextRecommendations;
