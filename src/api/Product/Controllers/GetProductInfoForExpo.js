"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, User, Tribe, Membership } = require("#models");

/**
 * @api {get} /api/v2/products/expo/:productId Get product details for expo
 * @apiVersion 2.0.10
 * @apiName Get product details for expo
 * @apiGroup WebAPI Products
 * @apiDescription Get product details for expo
 *
 * @apiHeader {String} [access-token] Users unique access-token.
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *     "code": 1,
 *     "time": 1664969344427,
 *     "data": {
 *         "productInfo": {
 *             "name": "Titttt",
 *             "created": 1655980813157,
 *             "file": [
 *                 {
 *                     "file": {
 *                         "originalName": "xnHPqj8QEo0U1mrg_1655980.792031.mp4",
 *                         "nameOnServer": "AlotNH9Z5uAtyQJ7KWTmwofNbOTWn6Qh",
 *                         "width": 568,
 *                         "height": 320,
 *                         "aspectRatio": 0.56338,
 *                         "duration": 2.166992,
 *                         "mimeType": "video/mp4",
 *                         "size": 232326,
 *                         "hslName": "0zI6FSIgtyAwgFd8zr53XlKLn1HqHCcR"
 *                     },
 *                     "thumb": {
 *                         "originalName": "xnHPqj8QEo0U1mrg_1655980.792031.mp4",
 *                         "nameOnServer": "LocoqbGPCnaYRi19kMp4lT9wzOP7Snsm",
 *                         "mimeType": "image/png",
 *                         "size": 139286
 *                     },
 *                     "_id": "62b443028abfe312773ce946",
 *                     "fileType": 1,
 *                     "order": 0
 *                 }
 *             ],
 *             "price": -1,
 *             "minPrice": -1,
 *             "maxPrice": -1,
 *             "ownerId": "60e4384b560d1466637e3eca",
 *             "visibility": "community"
 *         },
 *         "communities": [
 *             {
 *                 "_id": "6259495195a973220414ee1e",
 *                 "recurringPaymentType": 1,
 *                 "benefits": [
 *                     {
 *                         "type": 1,
 *                         "title": "Group chat",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 2,
 *                         "title": "Private messaging",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 3,
 *                         "title": "Video call",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 4,
 *                         "title": "Audio call",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 5,
 *                         "title": "Content description",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 6,
 *                         "title": "Go live",
 *                         "enabled": false
 *                     }
 *                 ],
 *                 "created": 1650018641479,
 *                 "deleted": false,
 *                 "name": "12",
 *                 "amount": 12,
 *                 "description": "Opis",
 *                 "order": 2,
 *                 "creatorId": "60e4384b560d1466637e3eca",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6259496995a973220414ee1f",
 *                 "recurringPaymentType": 1,
 *                 "benefits": [
 *                     {
 *                         "type": 1,
 *                         "title": "Group chat",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 2,
 *                         "title": "Private messaging",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 3,
 *                         "title": "Video call",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 4,
 *                         "title": "Audio call",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 5,
 *                         "title": "Content description",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 6,
 *                         "title": "Go live",
 *                         "enabled": false
 *                     }
 *                 ],
 *                 "created": 1650018665037,
 *                 "deleted": false,
 *                 "name": "chat",
 *                 "amount": 18,
 *                 "description": "Cgay",
 *                 "order": 3,
 *                 "creatorId": "60e4384b560d1466637e3eca",
 *                 "__v": 0,
 *                 "image": {
 *                     "originalName": "RDUJBiCFK7MZBfIO_1656484.825068.jpg",
 *                     "size": 586519,
 *                     "mimeType": "image/jpeg",
 *                     "nameOnServer": "upload_1538454bb391e7246825c31c564c9c7b",
 *                     "link": "/shared/Roja_Server/public/uploads/upload_1538454bb391e7246825c31c564c9c7b",
 *                     "thumbnailName": "thumb_1538454bb391e7246825c31c564c9c7b"
 *                 }
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 443225 Invalid productId parameter
 * @apiError (Errors) 443430 Invalid approval status of product
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:productId", async function (request, response) {
  try {
    const productId = request.params.productId;

    if (!productId) return Base.successResponse(response, Const.responsecodeProductNoProductId);

    if (!Utils.isValidObjectId(productId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidProductId,
        message: `GetProductInfoForExpo - invalid productId parameter`,
      });
    }

    const query = { _id: productId, isDeleted: false };
    if (request.user?.kidsMode === true) query.appropriateForKids = true;

    const product = await Product.findOne(query).lean();

    if (!product) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductNotFound,
        message: `GetProductInfoForExpo - product not found`,
      });
    }

    if (product.moderation.status !== Const.moderationStatusApproved) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidApprovalStatus,
        message: `GetProductInfoForExpo - product approval status invalid`,
      });
    }

    const user = request.user;
    const userId = !user ? null : user._id.toString();

    if (userId) {
      const { userRate, userCountryCode, userCurrency, conversionRates } =
        await Utils.getUsersConversionRate({
          user: request.user,
          accessToken: request.headers["access-token"],
        });

      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });
    }

    const owner = await User.findOne({ _id: product.ownerId }).lean();

    if (product.visibility === "public") {
      product.owner = owner;
      return Base.successResponse(response, Const.responsecodeSucceed, {
        productInfo: product,
      });
    }

    const productTribeIds = product.tribeIds;
    const productCommunityIds = product.communityIds;
    const isUserTribeMember = !userId
      ? false
      : await Utils.isUserTribeMember({ userId, productTribeIds });
    const isUserCommunityMember = !userId
      ? false
      : await Utils.isUserCommunityMember({
          userId,
          productCommunityIds,
        });

    let dataToSend = null;

    if (
      (product.visibility === "tribes" && !isUserTribeMember) ||
      (product.visibility === "community" && !isUserCommunityMember)
    ) {
      const productInfo = _.pick(product, [
        "_id",
        "name",
        "created",
        "file",
        "price",
        "originalPrice",
        "userPrice",
        "minPrice",
        "maxPrice",
        "isNegotiable",
        "ownerId",
        "visibility",
        "allowPublicComments",
      ]);
      if (product.visibility === "tribes") {
        const tribes = await Tribe.find({ _id: { $in: productTribeIds } }).lean();
        dataToSend = { productInfo, tribes };
      }
      if (product.visibility === "community") {
        const communities = await Membership.find({ _id: { $in: productCommunityIds } }).lean();
        dataToSend = { productInfo, communities };
      }
    } else {
      product.owner = owner;
      dataToSend = { productInfo: product };
    }

    if (!dataToSend) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductNotFound,
        message: `GetProductInfoForExpo - product not found, empty data`,
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    console.log("Error: ", e);
    if (e.name == "CastError") {
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.newErrorResponse({
      response,
      message: `GetProductInfoForExpo`,
      error: e,
    });
  }
});

module.exports = router;
