const { logger } = require("#infra");
const Utils = require("#utils");
const { Category, UserCategoryInteraction } = require("#models");

async function addUserCategoryInteraction({ product, user }) {
  try {
    if (!product.categoryId || !Utils.isValidObjectId(product.categoryId)) {
      return;
    }

    const categoryId = product.categoryId.toString();
    const parentCategoryId = product.parentCategoryId;
    const catIds = [categoryId];
    if (parentCategoryId != "-1") {
      catIds.push(parentCategoryId);
    }

    const categories = (await Category.find({ _id: { $in: catIds } }).lean()).map(
      (cat) => cat.name,
    );

    await UserCategoryInteraction.updateMany(
      { userId: user._id.toString(), category: { $in: categories } },
      { $inc: { interactions: 1 }, $set: { modified: Date.now() } },
      { upsert: true },
    );
  } catch (error) {
    logger.error("GetProductById - UserCategoryInteraction error:", error);
  }
}

module.exports = addUserCategoryInteraction;
