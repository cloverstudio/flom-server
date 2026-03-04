"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { Product, User, Category } = require("#models");

router.post("/", async function (request, response) {
  try {
    const { productId, subject, to } = request.body;

    const product = await Product.findById(productId).lean();
    product.owner = await User.findById(product.ownerId).lean();

    const categoryId = product.categoryId;
    const productMainCategoryId = product.productMainCategoryId;
    const ownerId = product.ownerId;

    const orQuery1 = [];
    if (categoryId) orQuery1.push({ categoryId });
    if (productMainCategoryId) orQuery1.push({ productMainCategoryId });
    if (ownerId) orQuery1.push({ ownerId });

    const query = {
      _id: { $ne: productId },
      "moderation.status": Const.moderationStatusApproved,
      type: product.type,
      isDeleted: false,
      visibility: "public",
      $or: orQuery1,
    };

    let similarProducts = await Product.find(query);

    let allOwners = [];
    let categoriesSet = new Set();

    similarProducts = similarProducts.map((product) => {
      allOwners.push(product.ownerId);
      categoriesSet.add(product.categoryId.toString());
      if (product.parentCategoryId !== "-1") {
        categoriesSet.add(product.parentCategoryId);
      }
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

    await Utils.sendWritingNewsLetterFromTemplate({ to, subject, product, similarProducts });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "TestNewsletterEmailTemplateController",
      error,
    });
  }
});

module.exports = router;
