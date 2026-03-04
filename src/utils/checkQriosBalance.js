const { logger } = require("#infra");
const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function checkQriosBalance(amount) {
  try {
    const balance =
      (await sendRequest({
        method: "GET",
        url: `https://deep.qrios.com/api/v1/client/balance`,
        headers: Config.qriosHeaders,
      })) || {};

    if (
      !balance?.available ||
      typeof balance?.available !== "number" ||
      balance?.available < amount
    ) {
      if (balance?.available) {
        logger.error(
          `Check Qrios balance, ${amount} NGN required, only ${balance?.available} NGN available.`
        );
      } else {
        logger.error(
          `Check Qrios balance, ${amount} NGN required, response from balance api: ${JSON.stringify(
            balance
          )}`
        );
      }

      return false;
    }

    logger.info(
      `Check Qrios balance, ${balance.available} NGN in Qrios Flom wallet, taking ~ ${amount} NGN`
    );

    return true;
  } catch (error) {
    logger.error("Check Qrios balance", error);
    return false;
  }
}

module.exports = checkQriosBalance;
