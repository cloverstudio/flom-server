const { logger } = require("#infra");
const { Const } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();
const { Product } = require("#models");
const getCategories = require("./getCategories");

async function syncProducts(timestamp = 0) {
  try {
    logger.info("Recombee, syncProducts, attempting to syncProducts...");

    const catObj = await getCategories();

    const products = await Product.find({ modified: { $gt: timestamp } }).lean();

    let count = 0;
    let requests = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const categories = [];

      // If product has a categoryId, add category name
      if (product.categoryId && catObj[product.categoryId.toString()]) {
        categories.push(catObj[product.categoryId.toString()]);
      }

      // If product has a parentCategoryId, add parentCategory name
      if (
        product.parentCategoryId &&
        product.parentCategoryId !== "-1" &&
        catObj[product.parentCategoryId]
      ) {
        categories.push(catObj[product.parentCategoryId]);
      }

      product.duration = product?.file?.[0]?.file?.duration ?? null;

      requests.push(
        new rqs.SetItemValues(
          "p_" + product._id.toString(),
          {
            name: product.name,
            itemType: "Product",
            type: Const.recombeeProductTypesMap[product.type] ?? "Unknown",
            countryCode: product.address?.countryCode ?? "Unknown",
            created: new Date(product.created).toISOString(),
            ...(categories.length > 0 && { categories }),
            language: product.language ?? "en",
            ...(product.tags && {
              tags: product.tags.split(" ").map((tag) => tag.replace("#", "")),
            }),
            isAvailable:
              !product.isDeleted &&
              product.moderation.status === Const.moderationStatusApproved &&
              product.itemCount !== 0,
            appropriateForKids: product.appropriateForKids ?? false,
            ownerId: product.ownerId,
            visibility: product.visibility ?? "public",
            tribeIds: product.tribeIds ?? [],
            communityIds: product.communityIds ?? [],
            ...(product.location && {
              latitude: product.location.coordinates[1],
              longitude: product.location.coordinates[0],
            }),
            ...(product.duration && { duration: Math.round(product.duration) }),
          },
          { cascadeCreate: true },
        ),
      );
      count++;

      if (requests.length >= 950 || i === products.length - 1) {
        try {
          const response = await client.send(new rqs.Batch(requests));

          for (let res of response) {
            if (res.status >= 400) {
              logger.error("Error syncing item to Recombee:", res);
            }
          }
        } catch (error) {
          logger.error("Recombee, item syncProducts error:", error);
        }

        logger.info("Recombee, syncProducts, processed items: ", count);
        requests = [];
        count = 0;

        await sleep(5); // To avoid rate limits
      }
    }
  } catch (error) {
    logger.error("Recombee, syncProducts error:", error);
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

module.exports = syncProducts;
