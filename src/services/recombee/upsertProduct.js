const { logger } = require("#infra");
const { Const } = require("#config");
const { client, rqs } = require("./client").getClientAndRequest();
const getCategories = require("./getCategories");

async function upsertProduct({ product }) {
  try {
    const catObj = await getCategories();

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

    await client.send(
      new rqs.SetItemValues(
        "p_" + product._id.toString(),
        {
          name: product.name,
          itemType: "Product",
          type: Const.recombeeProductTypesMap[product.type] ?? "Unknown",
          countryCode: product.address?.countryCode ?? "Unknown",
          language: product.language ?? "en",
          created: new Date(product.created).toISOString(),
          ...(categories.length > 0 && { categories }),
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

    return;
  } catch (error) {
    logger.error("Recombee, upsertProduct error:", error);
    return;
  }
}

module.exports = upsertProduct;
