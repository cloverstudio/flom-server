const { logger } = require("#infra");
const { UserTagInteraction } = require("#models");

async function addUserTagInteraction({ product, user }) {
  try {
    const tags = (product.tags ?? "").split(" ").map((tag) => tag.trim().replace("#", ""));

    await UserTagInteraction.updateMany(
      { userId: user._id.toString(), tag: { $in: tags } },
      { $inc: { interactions: 1 }, $set: { modified: Date.now() } },
      { upsert: true },
    );
  } catch (error) {
    logger.error("AddViewToProductController - UserTagInteraction error:", error);
  }
}

module.exports = addUserTagInteraction;
