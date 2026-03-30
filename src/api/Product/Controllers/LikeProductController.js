"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const {
  Product,
  User,
  Transfer,
  UserTagInteraction,
  UserCategoryInteraction,
  Category,
} = require("#models");
const { recombee } = require("#services");
const { sendBonus } = require("#logics");

/**
 * @api {get} /api/v2/product/like Get Liked Products
 * @apiVersion 2.0.7
 * @apiName Get Liked Products
 * @apiGroup WebAPI Products
 * @apiDescription Get Liked Products
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {
 *     "likedProducts": [
 *       "5cd27ca543ed18722efe6efa"
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    let dataToSend = {};
    dataToSend.likedProducts = [];

    if (request.user.likedProducts) dataToSend.likedProducts = request.user.likedProducts;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("LikeProductController, GET", e);
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.errorResponse(response, Const.httpCodeServerError, "LikeProductController, GET", e);
    return;
  }
});

/**
 * @api {post} /api/v2/product/like/add Like Product By Id
 * @apiVersion 2.0.7
 * @apiName Like Product By Id
 * @apiGroup WebAPI Products
 * @apiDescription Like Product By Id. If product is from Recombee recommendation send the recommId as well.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId productId
 * @apiParam {String} [recommId] recommId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400510 No productId
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000780 Product already liked
 */

router.post("/add", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    const productId = request.body.productId;
    const recommId = request.body.recommId ?? null;

    if (!productId) return Base.successResponse(response, Const.responsecodeProductNoProductId);

    const product = await Product.findOne({ _id: productId, isDeleted: false }).lean();

    if (!product) {
      return Base.successResponse(response, Const.responsecodeProductNotFound);
    }

    // check if product is already liked
    let likedProducts = [];

    if (request.user.likedProducts) likedProducts = request.user.likedProducts;
    const index = likedProducts.indexOf(productId);

    if (index > -1) {
      return Base.successResponse(response, Const.responsecodeProductAlreadyLiked);
    }

    await User.findByIdAndUpdate(request.user._id, {
      $push: { likedProducts: productId },
    });

    //update product number of likes
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { numberOfLikes: 1 } },
      { new: true, lean: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed);

    try {
      await sendBonus({
        userId: user._id.toString(),
        bonusType: Const.bonusTypeLike,
        productId,
        productName: product.name,
        ownerId: product.ownerId,
      });

      if (updatedProduct.numberOfLikes >= Const.highEngagementContentThreshold) {
        const bonusTransfer = await Transfer.findOne({
          receiverId: updatedProduct.ownerId,
          bonusType: Const.bonusTypeHighEngagementContent,
        }).lean();

        if (!bonusTransfer) {
          await sendBonus({
            userId: updatedProduct.ownerId,
            bonusType: Const.bonusTypeHighEngagementContent,
            productId,
            productName: updatedProduct.name,
            ownerId: updatedProduct.ownerId,
          });
        }
      }
    } catch (error) {
      logger.error("LikeProductController, Add like, sending bonus", error);
    }

    try {
      await recombee.recordInteraction({
        user: request.user,
        product: updatedProduct,
        type: "like",
        recommId,
      });
    } catch (error) {
      logger.error("LikeProductController, Add like, recombee", error);
    }

    try {
      const tags = (product.tags ?? "").split(" ").map((tag) => tag.trim().replace("#", ""));

      await UserTagInteraction.updateMany(
        { userId: user._id.toString(), tag: { $in: tags } },
        { $inc: { interactions: 3 }, $set: { modified: Date.now() } },
        { upsert: true },
      );
    } catch (error) {
      logger.error("LikeProductController, add like - UserTagInteraction error:", error);
    }

    try {
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
        { $inc: { interactions: 3 }, $set: { modified: Date.now() } },
        { upsert: true },
      );
    } catch (error) {
      logger.error("LikeProductController, add like - UserCategoryInteraction error:", error);
    }
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("LikeProductController, Add like", e);
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.errorResponse(response, Const.httpCodeServerError, "LikeProductController, Add like", e);
    return;
  }
});

/**
 * @api {post} /api/v2/product/like/remove Dislike Product By Id
 * @apiVersion 2.0.7
 * @apiName Dislike Product By Id
 * @apiGroup WebAPI Products
 * @apiDescription Dislike Product By Id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId productId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400510 No productId
 * @apiError (Errors) 400790 Product not liked
 * @apiError (Errors) 400800 Product not disliked
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 4000007 Token not valid
 **/

router.post("/remove", auth({ allowUser: true }), async function (request, response) {
  try {
    const productId = request.body.productId;

    if (!productId) return Base.successResponse(response, Const.responsecodeProductNoProductId);

    const product = await Product.findOne({ _id: productId }).exec();

    if (!product) {
      return Base.successResponse(response, Const.responsecodeProductNotFound);
    }

    let likedProducts = [];

    if (request.user.likedProducts) likedProducts = request.user.likedProducts;

    // check if product is already liked
    const index = likedProducts.indexOf(productId);

    if (index < 0) {
      return Base.successResponse(response, Const.responsecodeProductNotLiked);
    }

    const dislikedProduct = likedProducts.splice(index, 1);

    if (dislikedProduct === productId) {
      return Base.successResponse(response, Const.responsecodeProductNotDisliked);
    }

    await User.findByIdAndUpdate(request.user._id, {
      $set: { likedProducts: likedProducts },
    });

    //update product number of likes
    product.numberOfLikes--;
    await product.save();

    Base.successResponse(response, Const.responsecodeSucceed);

    try {
      await recombee.recordInteraction({
        user: request.user,
        product: product.toObject(),
        type: "unlike",
      });
    } catch (error) {
      logger.error("LikeProductController, dislike, recombee", error);
    }

    try {
      const tags = (product.tags ?? "").split(" ").map((tag) => tag.trim().replace("#", ""));

      await UserTagInteraction.updateMany(
        { userId: request.user._id.toString(), tag: { $in: tags } },
        { $inc: { interactions: -3 }, $set: { modified: Date.now() } },
        { upsert: true },
      );
    } catch (error) {
      logger.error("LikeProductController, dislike - UserTagInteraction error:", error);
    }

    try {
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
        { userId: request.user._id.toString(), category: { $in: categories } },
        { $inc: { interactions: -3 }, $set: { modified: Date.now() } },
        { upsert: true },
      );
    } catch (error) {
      logger.error("LikeProductController, dislike - UserCategoryInteraction error:", error);
    }
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("LikeProductController, dislike", e);
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.errorResponse(response, Const.httpCodeServerError, "LikeProductController, dislike", e);
    return;
  }
});

module.exports = router;
