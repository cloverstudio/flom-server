"use strict";

const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, User, Tribe, Category } = require("#models");

async function sendNewsletterToSubscribers({ product, owner }) {
  try {
    if (
      product.moderation.status !== Const.moderationStatusApproved ||
      product.type !== Const.productTypeTextStory
    ) {
      return;
    }

    const subject = owner.name
      ? `${owner.name} posted: ${product.name}`
      : `${owner.userName} via Flom posted: ${product.name}`;

    const subscribers = await User.find({ followedBusinesses: owner._id.toString() }).lean();

    for (const subscriber of subscribers) {
      if (!subscriber.email) continue;

      const similarProducts = await getSimilarProducts({ product, subscriber });

      await Utils.sendWritingNewsLetterFromTemplate({
        to: subscriber.email,
        subject,
        product,
        similarProducts,
      });
    }
  } catch (error) {
    logger.error("sendNewsletterToSubscribers", error);
  }
}

async function getSimilarProducts({ product, subscriber }) {
  const categoryId = product.categoryId;
  const productMainCategoryId = product.productMainCategoryId;
  const ownerId = product.ownerId;

  const { userRate, userCountryCode, userCurrency, conversionRates } =
    await Utils.getUsersConversionRate({ user: subscriber });

  const kidsMode = subscriber.kidsMode;
  const blocked = subscriber.blocked || [];

  let userTribeIdsArray = await Tribe.aggregate([
    {
      $match: {
        $or: [
          { ownerId: subscriber._id.toString() },
          { "members.accepted.id": subscriber._id.toString() },
        ],
      },
    },
    { $project: { _id: 1 } },
  ]);
  userTribeIdsArray = userTribeIdsArray.map((element) => {
    return element._id;
  });

  let orQuery2 = [];
  if (!userTribeIdsArray || userTribeIdsArray.length === 0) orQuery2.push({ visibility: "public" });
  else orQuery2.push({ visibility: "public" }, { tribeIds: { $in: userTribeIdsArray } });

  let orQuery1 = [];
  if (categoryId) orQuery1.push({ categoryId });
  if (productMainCategoryId) orQuery1.push({ productMainCategoryId });
  if (ownerId) orQuery1.push({ ownerId });

  const query = {
    _id: { $ne: product._id.toString() },
    $and: [{ $or: orQuery1 }, { $or: orQuery2 }],
    "moderation.status": Const.moderationStatusApproved,
    type: product.type || 5,
    isDeleted: false,
  };
  if (kidsMode === true || !subscriber) query.appropriateForKids = true;
  if (blocked && blocked.length > 0) query.ownerId = { $nin: blocked };

  let similarProducts = await Product.find(query);

  let allOwners = [];
  let categoriesSet = new Set();

  similarProducts = similarProducts.map((product) => {
    allOwners.push(product.ownerId);
    categoriesSet.add(product.categoryId.toString());
    if (product.parentCategoryId !== "-1") {
      categoriesSet.add(product.parentCategoryId);
    }
    Utils.addUserPriceToProduct({
      product,
      userRate,
      userCountryCode,
      userCurrency,
      conversionRates,
    });
    return product.toObject();
  });

  const owners = await User.find({ _id: { $in: allOwners } }).lean();

  let ownersObj = {};
  owners.forEach((owner) => {
    ownersObj[owner._id.toString()] = owner;
  });

  const categories = await Category.find({ _id: { $in: [...categoriesSet] } }).lean();
  let categoriesObj = {};
  categories.forEach((category) => {
    categoriesObj[category._id.toString()] = category;
  });

  similarProducts = similarProducts.map((product) => {
    const productExtended = {
      ...product,
      owner: ownersObj[product.ownerId],
      category: categoriesObj[product.categoryId.toString()],
    };
    if (product.parentCategoryId !== "-1") {
      productExtended.parentCategory = categoriesObj[product.parentCategoryId];
    }
    return productExtended;
  });

  return similarProducts;
}

module.exports = sendNewsletterToSubscribers;
