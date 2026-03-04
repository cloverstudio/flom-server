const { logger } = require("#infra");
const { Const } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();
const { Transfer } = require("#models");

async function syncPurchases(timestamp = 0) {
  try {
    logger.info("Recombee, syncPurchases, attempting to syncPurchases...");

    const transfers = await Transfer.find({
      status: Const.transferComplete,
      transferType: {
        $in: [
          Const.transferTypeMarketplace,
          Const.transferTypeSuperBless,
          Const.transferTypeSprayBless,
        ],
      },
      created: { $gt: timestamp },
    }).lean();

    let count = 0;
    let requests = [];

    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i];

      if (transfer.transferType === Const.transferTypeMarketplace) {
        for (const item of transfer.basket) {
          requests.push(
            new rqs.AddPurchase(transfer.senderId, "p_" + item.id, {
              cascadeCreate: true,
              ...(item.recommId && { recommId: item.recommId }),
            }),
          );
        }
      } else if (
        (transfer.transferType === Const.transferTypeSuperBless ||
          transfer.transferType === Const.transferTypeSprayBless) &&
        (transfer.productId || transfer.liveStreamId)
      ) {
        const itemId = !transfer.liveStreamId
          ? "p_" + transfer.productId
          : "l_" + transfer.liveStreamId;

        requests.push(
          new rqs.AddRating(transfer.senderId, itemId, 1, {
            cascadeCreate: true,
            ...(transfer.recommId && { recommId: transfer.recommId }),
          }),
        );
      } else {
        count++;
        continue;
      }
      count++;

      if (requests.length >= 950 || i === transfers.length - 1) {
        try {
          const response = await client.send(new rqs.Batch(requests));

          for (let res of response) {
            if (res.status >= 400) {
              logger.error("Error syncing transfer to Recombee:", res);
            }
          }
        } catch (error) {
          logger.error("Recombee, transfer syncPurchases error:", error);
        }

        logger.info("Recombee, syncPurchases, processed transfers: ", count);
        requests = [];
        count = 0;

        await sleep(5); // To avoid rate limits
      }
    }
  } catch (error) {
    logger.error("Recombee, syncPurchases error:", error);
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

module.exports = syncPurchases;
