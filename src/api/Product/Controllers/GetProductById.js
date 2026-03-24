"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const {
  Product,
  User,
  AdminPageUser,
  Category,
  Review,
  UserTagInteraction,
  UserCategoryInteraction,
} = require("#models");
const { recombee } = require("#services");

/**
 * @api {post} /api/v2/product/getbyid Get Product By Id
 * @apiVersion 2.0.7
 * @apiName Get Product By Id
 * @apiGroup WebAPI Products
 * @apiDescription Get Product By Id. If product is from Recombee recommendation send the recommId as well.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Request body) {String} productId  productId
 * @apiParam (Request body) {String} [recommId] recommId
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "_id": "5f4f5ab618f352279ef2a82d",
 *     "price": 7.71,
 *     "file": [
 *       {
 *         "file": {
 *           "originalName": "bgdyh xvgf.jpg",
 *           "size": 135599,
 *           "mimeType": "image/png",
 *           "nameOnServer": "M7d1RtmGJ1hLIxK9WNZKleCzDAm3L0NB"
 *         },
 *         "thumb": {
 *           "originalName": "bgdyh xvgf.jpg",
 *           "size": 48000,
 *           "mimeType": "image/jpeg",
 *           "nameOnServer": "VbiHFtsR1K8pjaQl1YUVwCTeHsUJys2L"
 *         },
 *         "_id": "5f4f5ab618f352279ef2a82e",
 *         "order": 0,
 *         "fileType": 0
 *       }
 *     ],
 *     "image": [],
 *     "location": {
 *       "type": "Point",
 *       "coordinates": [
 *         -91.24619849999999,
 *         47.41408209999999
 *       ]
 *     },
 *     "minPrice": -1,
 *     "maxPrice": -1,
 *     "localPrice": {
 *       "localMin": -1,
 *       "localMax": -1,
 *       "localAmount": 3000,
 *       "amount": 7.71,
 *       "minAmount": -1,
 *       "maxAmount": -1,
 *       "currencyCode": "NGN",
 *       "currencySymbol": "₦",
 *       "currencyCountryCode": "234"
 *     },
 *     "productMainCategoryId": "5d88d5551f657c440c4fd914",
 *     "productSubCategoryId": "5d88d5551f657c440c4fd966",
 *     "categoryId": "5ec3ee665ea9301807bd24c8",
 *     "name": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *     "description": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *     "ownerId": "5f4e5dbb18f352279ef2a7fb",
 *     "created": 1599036086695,
 *     "status": 1,
 *     "itemCount": 5,
 *     "isNegotiable": true,
 *     "condition": "New",
 *     "priceRange": false,
 *     "showYear": false,
 *     "year": 2020,
 *     "__v": 0,
 *     "numberOfViews": 39,
 *     "numberOfLikes": 50,
 *     "score": 0,
 *     "dist": {
 *       "calculated": 10101.309663865966,
 *       "location": {
 *         "type": "Point",
 *         "coordinates": [
 *           -91.24619849999999,
 *           47.41408209999999
 *         ]
 *       }
 *     },
 *     "category": {
 *       "_id": "5ec3ee665ea9301807bd24c8",
 *       "name": "Cables & Cords",
 *       "parentId": "5ec3ee665ea9301807bd24a6",
 *       "__v": 0
 *     },
 *     "numberOfProductsSold": 0
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400510 No productionId
 * @apiError (Errors) 400600 Product, wrong production Id format
 * @apiError (Errors) 443225 Invalid productId parameter
 * @apiError (Errors) 443821 Sensitive content
 * @apiError (Errors) 443822 Restricted content
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", async function (request, response) {
  try {
    const { productId, recommId = null } = request.body;
    const accessToken = request.headers["access-token"];
    let user;

    if (!productId) return Base.successResponse(response, Const.responsecodeProductNoProductId);

    if (!Utils.isValidObjectId(productId)) {
      return Base.successResponse(response, Const.responsecodeInvalidProductId);
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false }).lean();

    let dataToSend = {};

    if (!product) {
      return Base.successResponse(response, Const.responsecodeProductNotFound);
    }

    if (!accessToken && product.appropriateForKids === false) {
      return Base.successResponse(response, Const.responsecodeSensitiveContent);
    }

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (accessToken) {
      if (accessToken.length === Const.tokenLength) {
        user = await User.findOne({ "token.token": accessToken }).lean();
        if (!user) return Base.successResponse(response, Const.responsecodeSigninInvalidToken);
        const userId = user._id.toString();
        const productTribeIds = product.tribeIds;
        const productCommunityIds = product.communityIds;

        const isUserTribeMember = await Utils.isUserTribeMember({ userId, productTribeIds });
        const isUserCommunityMember = await Utils.isUserCommunityMember({
          userId,
          productCommunityIds,
        });

        if (user.kidsMode === true && product.appropriateForKids === false) {
          return Base.successResponse(response, Const.responsecodeSensitiveContent);
        }

        if (
          (product.visibility === "tribes" && !isUserTribeMember) ||
          (product.moderation.status !== Const.moderationStatusApproved &&
            userId !== product.ownerId)
        ) {
          return Base.successResponse(response, Const.responsecodeRestrictedContent);
        } else if (
          (product.visibility === "community" && !isUserCommunityMember) ||
          (product.moderation.status !== Const.moderationStatusApproved &&
            userId !== product.ownerId)
        ) {
          return Base.successResponse(response, Const.responsecodeRestrictedContent);
        }
      } else {
        const adminUser = await AdminPageUser.findOne({ "token.token": accessToken }).lean();
        if (!adminUser) {
          return Base.successResponse(response, Const.responsecodeSigninInvalidToken);
        }
      }
    } else if (
      product.visibility !== "public" ||
      product.moderation.status !== Const.moderationStatusApproved
    ) {
      return Base.successResponse(response, Const.responsecodeRestrictedContent);
    }

    const category = await Category.findOne({ _id: product.categoryId }).lean();

    let parentCategory;
    if (product.parentCategoryId !== "-1") {
      parentCategory = await Category.findOne({ _id: product.parentCategoryId }).lean();
    }

    const owner = await User.findOne({ _id: product.ownerId }, Const.userSelectQuery).lean();
    if (owner && !owner.avatar) {
      owner.avatar = {};
    }
    product.owner = owner;

    let review = user
      ? await Review.findOne({
          product_id: product._id.toString(),
          user_id: user._id.toString(),
          isDeleted: false,
        })
      : null;

    if (category) {
      product.category = category;
    }
    if (parentCategory) {
      product.parentCategory = parentCategory;
    }

    if (review) {
      review = review.toObject();
      review.name = user.name;
      review.avatar = user.avatar;
      review.phoneNumber = user.phoneNumber;
      product.review = review;
    }

    Utils.addUserPriceToProduct({
      product,
      userRate,
      userCountryCode,
      userCurrency,
      conversionRates,
    });

    dataToSend = product;

    await Product.findByIdAndUpdate(
      dataToSend._id,
      {
        $inc: {
          numberOfViews: 1,
        },
      },
      {
        new: true,
      },
    );

    if (accessToken) {
      const user = await User.findOne({ "token.token": accessToken }).lean();

      if (user && product.type === 5) {
        const { recentlyViewedProducts = [] } = user;

        const position = recentlyViewedProducts.indexOf(productId);

        if (position > 0) {
          recentlyViewedProducts.splice(position, 1);
        }
        //if product is not first in the list, add it and save user to db
        if (position !== 0) {
          recentlyViewedProducts.unshift(productId);
          if (recentlyViewedProducts.length > 10) {
            recentlyViewedProducts.pop();
          }

          await User.findByIdAndUpdate(user._id.toString(), { recentlyViewedProducts });
        }
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);

    if (user && product) {
      try {
        await recombee.recordInteraction({ user, product, type: "view", recommId });
      } catch (error) {
        logger.error("GetProductById, recombee", error);
      }

      try {
        const tags = (product.tags ?? "").split(" ").map((tag) => tag.trim().replace("#", ""));

        await UserTagInteraction.updateMany(
          { userId: user._id.toString(), tag: { $in: tags } },
          { $inc: { interactions: 1 }, $set: { modified: Date.now() } },
          { upsert: true },
        );
      } catch (error) {
        logger.error("GetProductById - UserTagInteraction error:", error);
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
          { $inc: { interactions: 1 }, $set: { modified: Date.now() } },
          { upsert: true },
        );
      } catch (error) {
        logger.error("GetProductById - UserCategoryInteraction error:", error);
      }
    }
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("GetProductById", e);
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.errorResponse(response, Const.httpCodeServerError, "GetProductById", e);
  }
});

module.exports = router;
