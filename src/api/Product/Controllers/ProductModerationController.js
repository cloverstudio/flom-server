"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, User, ProductModerationLog } = require("#models");
const { recombee } = require("#services");
const {
  sendApprovedProductNotifications,
  sendApprovedProductBonuses,
  sendNewsletterToSubscribers,
} = require("../helpers");

/**
 * @api {patch} /api/v2/products/moderation/:productId Change product moderation status
 * @apiVersion 2.0.8
 * @apiName Change product moderation status
 * @apiGroup WebAPI Products
 * @apiDescription API for changing moderation status of the product. You can add optional comment.
 * Users on Admin page need at least Reviewer role to access this API. Reviewers can review, approve, deny products or mark then as "approval needed".
 * Content approver, in addition to what reviewer can do, can approve or deny products that are marked with "approval needed"
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} moderationStatus Moderation status (1 - pending, 2 - rejected, 3 - approved, 4 - approval needed)
 * @apiParam {String} [comment] Moderation comment. Accepts empty string
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "product": {
 *       "_id": "5f4f5ab618f352279ef2a82d",
 *       "price": 7.71,
 *       "file": [
 *         {
 *           "file": {
 *             "originalName": "bgd4y2vgf.jpg",
 *             "size": 135599,
 *             "mimeType": "image/png",
 *             "nameOnServer": "M7d1RtmGJ1hLIxK9WNZKleCzDAm3L0NB"
 *             "aspectRatio" : 1.33334,
 *           },
 *           "thumb": {
 *             "originalName": "bgd4y2vgf.jpg",
 *             "size": 48000,
 *             "mimeType": "image/jpeg",
 *             "nameOnServer": "VbiHFtsR1K8pjaQl1YUVwCTeHsUJys2L"
 *           },
 *           "_id": "5f4f5ab618f352279ef2a82e",
 *           "order": 0,
 *           "fileType": 0
 *         }
 *       ],
 *       "image": [],
 *       "location": {
 *         "type": "Point",
 *         "coordinates": [
 *           -91.24619849999999,
 *           47.41408209999999
 *         ]
 *       },
 *       "minPrice": -1,
 *       "maxPrice": -1,
 *       "localPrice": {
 *         "localMin": -1,
 *         "localMax": -1,
 *         "localAmount": 3000,
 *         "amount": 7.71,
 *         "minAmount": -1,
 *         "maxAmount": -1,
 *         "currencyCode": "NGN",
 *         "currencySymbol": "₦",
 *         "currencyCountryCode": "234"
 *       },
 *       "productMainCategoryId": "5d88d5551f657c440c4fd914",
 *       "productSubCategoryId": "5d88d5551f657c440c4fd966",
 *       "categoryId": "5ec3ee665ea9301807bd24c8",
 *       "name": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *       "description": "Power Supply for Original Microsoft Xbox AC Adapter Cord Charger Console System",
 *       "ownerId": "5f4e5dbb18f352279ef2a7fb",
 *       "created": 1599036086695,
 *       "status": 1,
 *       "itemCount": 5,
 *       "isNegotiable": false,
 *       "condition": "New",
 *       "priceRange": false,
 *       "showYear": false,
 *       "year": 2020,
 *       "__v": 0,
 *       "numberOfViews": 39,
 *       "numberOfLikes": 50,
 *       "score": 0,
 *       "moderation": {
 *         "status": 3,
 *         "comment": "comment",
 *       }
 *     },
 *   }
 * }
 *
 * @apiSuccessExample {json} Push notification (to owner when approved/rejected)
 * {
 *   "pushType": 780,
 *   "info": {
 *     "title": "Product name approved",
 *     "productId": "61823caa33b1083a21fc68f0",
 *     "contentType": 1, //product type
 *     "moderationStatus": 3,
 *     "from": {
 *       "id": "61823caa33b1083a21fc68f0",
 *       "name": "Name",
 *       "phoneNumber": "+23444444444",
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Push notification (to tribe users)
 * {
 *   "pushType": 781,
 *   "info": {
 *     "title": "Product name approved",
 *     "productId": "61823caa33b1083a21fc68f0",
 *     "contentType": 1, //product type
 *     "from": {
 *       "id": "61823caa33b1083a21fc68f0",
 *       "name": "Name",
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1Z9IDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52el9inZOQ20yNn2PpnMwi"
 *         }
 *       },
 *       "phoneNumber": "+23444444444",
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 443221 Wrong or no moderationStatus parameter
 * @apiError (Errors) 443225 Invalid productId parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/:productId",
  auth({ allowAdmin: true, role: Const.Role.REVIEWER }),
  async function (request, response) {
    try {
      const { productId } = request.params;

      const moderationStatus = request.body.moderationStatus
        ? +request.body.moderationStatus
        : undefined;
      const comment = request.body.comment;
      const adminUserId = request.user._id.toString();
      const adminUsername = request.user.username;

      if (!Utils.isValidObjectId(productId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProductId,
          message: `ProductModerationController, productId is not valid`,
        });
      }

      const product = await Product.findOne({ _id: productId, isDeleted: false });
      if (!product) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNotFound,
          message: `ProductModerationController, product not found`,
        });
      }

      if (
        product.moderation.status === Const.moderationStatusApprovalNeeded &&
        request.user.role < Const.Role.APPROVER
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUnauthorized,
          type: Const.logTypeAdminPage,
          message: `ProductModerationController, unauthorized`,
        });
      }

      const moderationStatusArray = [1, 2, 3, 4];
      if (moderationStatusArray.indexOf(moderationStatus) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeWrongModerationStatusParameter,
          message: `ProductModerationController, wrong or no moderationStatus parameter`,
        });
      }

      const oldProductComment = product.moderation.comment || "";
      const oldProductStatus = product.moderation.status;

      const moderation = {
        status: moderationStatus,
        comment: comment,
        timestamp: Date.now(),
      };

      product.moderation = moderation;
      product.modified = Date.now();
      await product.save();

      const productObj = product.toObject();
      delete productObj.__v;

      const logData = {
        productId,
        productName: productObj.name,
        productType: productObj.type,
        oldProductStatus,
        newProductStatus: moderationStatus,
        oldProductComment,
        newProductComment: comment,
        adminUserId,
        adminUsername,
      };

      await ProductModerationLog.create(logData);

      const owner = await User.findOne({ _id: productObj.ownerId }).lean();
      if (owner) {
        productObj.owner = {
          _id: owner._id.toString(),
          username: owner.userName,
          phoneNumber: owner.phoneNumber,
          created: owner.created,
          avatar: owner.avatar || {},
          isAppUser: owner.isAppUser,
        };
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        product: productObj,
      });

      if (moderationStatus === Const.moderationStatusApproved) {
        recombee.upsertProduct({ product: productObj });
      }

      sendApprovedProductNotifications({ product: productObj, owner });
      sendApprovedProductBonuses({ product: productObj, owner });
      sendNewsletterToSubscribers({ product: productObj, owner });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ProductModerationController",
        error,
      });
    }
  },
);

module.exports = router;
