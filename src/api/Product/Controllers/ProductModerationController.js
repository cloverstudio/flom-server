"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Notification, User, Tribe, ProductModerationLog, Category } = require("#models");
const { sendBonus } = require("#logics");
const { recombee } = require("#services");

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

      try {
        if (moderationStatus === Const.moderationStatusApproved) {
          await recombee.upsertProduct({ product: productObj });
        }
      } catch (error) {
        logger.error("ProductModerationController, recombee", error);
      }

      try {
        if (
          moderationStatus === Const.moderationStatusApproved ||
          moderationStatus === Const.moderationStatusRejected
        ) {
          await sendNotifications({ product: productObj, owner });
        }

        if (moderationStatus === Const.moderationStatusApproved) {
          if (product.type === Const.productTypeProduct) {
            await sendBonus({
              userId: productObj.ownerId,
              userPhoneNumber: owner.phoneNumber,
              bonusType: Const.dataForFirstPaymentOrApprovedProduct,
              productId: productObj._id.toString(),
              productName: productObj.name,
              ownerId: productObj.ownerId,
            });
          } else {
            await sendBonus({
              userId: productObj.ownerId,
              bonusType: Const.bonusTypeContent,
              productId: productObj._id.toString(),
              productName: productObj.name,
              ownerId: productObj.ownerId,
            });
          }

          if (productObj.type === Const.productTypeVideoStory && productObj.linkedProductId) {
            const linkedProduct = await Product.findById(productObj.linkedProductId).lean();

            const {
              isDeleted,
              ownerId: linkedOwnerId,
              engagementBonus: {
                allowed = false,
                allowEngagementBonus = false,
                budgetCredits = 0,
                engagementBudgetCredits: engagementBudgetCreditsNew = 0,
                creditsPerLinkedExpo = 0,
              } = {},
            } = linkedProduct;

            const engagementBonusAllowed = allowed || allowEngagementBonus;
            const engagementBudgetCredits = budgetCredits || engagementBudgetCreditsNew;

            const linkedOwner = await User.findOne({
              _id: linkedOwnerId,
              "isDeleted.value": false,
            }).lean();

            if (
              linkedOwnerId !== productObj.ownerId &&
              !isDeleted &&
              engagementBonusAllowed &&
              engagementBudgetCredits > (linkedOwner?.creditBalance || 0) &&
              creditsPerLinkedExpo > 0
            ) {
              await sendBonus({
                userId: productObj.ownerId,
                bonusType: Const.creditsForLinkedProductInExpo,
                linkedProductId: productObj.linkedProductId,
              });
            }
          }
        }
      } catch (error) {
        logger.error("ProductModerationController, messaging & bonuses", error);
      }

      if (
        moderationStatus === Const.moderationStatusApproved &&
        productObj.type === Const.productTypeTextStory
      ) {
        sendNewsletterToSubscribers({ product: productObj, owner });
      }
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ProductModerationController",
        error,
      });
    }
  },
);

const sendNotifications = async function ({ product, owner }) {
  const sender = await User.findOne({ _id: Config.flomSupportUserId }).lean();

  await notifyProductOwner({ product, owner, sender });

  if (product.moderation.status === Const.moderationStatusApproved) {
    await notifyTribeMembersAndSubscribers({ product, owner });
  }
};

const notifyProductOwner = async function ({ product, owner, sender }) {
  let title = `${product.name} has been `;
  let notificationType;
  const receiverIds = [owner._id.toString()];
  const senderId = sender._id.toString();

  if (product.moderation.status === Const.moderationStatusApproved) {
    notificationType = Const.notificationTypeProductApproved;
    title += "approved";
  } else {
    notificationType = Const.notificationTypeProductRejected;
    title += "rejected";
  }

  await Utils.sendPushNotifications({
    pushTokens: owner.pushToken,
    pushType: Const.pushTypeProductModeration,
    info: {
      title,
      productId: product._id.toString(),
      contentType: product.type,
      moderationStatus: product.moderation.status,
      from: {
        id: senderId,
        name: sender.name,
        phoneNumber: sender.phoneNumber,
        avatar: sender.avatar,
      },
    },
  });

  await Notification.create({
    title,
    referenceId: product._id.toString(),
    receiverIds,
    senderId,
    notificationType,
    notificationSubType: product.type,
  });

  await incrementUsersNotificationsUnreadCount({ userIds: receiverIds });
};

const notifyTribeMembersAndSubscribers = async function ({ product, owner }) {
  const receiverIds = [];
  const pushTokens = [];

  if (product.visibility === Const.productVisibilityTribes) {
    const tribes = await Tribe.aggregate([
      { $match: { _id: { $in: product.tribeIds.map((id) => Utils.toObjectId(id)) } } },
      { $unwind: "$members.accepted" },
      {
        $group: {
          _id: null,
          members: { $push: "$members.accepted" },
        },
      },
    ]);

    let tribeUserIds = [];
    if (tribes.length > 0) {
      tribeUserIds = [...new Set(tribes[0].members.map((member) => member.id))].map((memberId) =>
        Utils.toObjectId(memberId),
      );
    }

    if (tribeUserIds.length > 0) {
      const tribeUsers = await User.aggregate([
        { $match: { _id: { $in: tribeUserIds }, "isDeleted.value": false } },
        { $unwind: "$pushToken" },
        {
          $group: {
            _id: null,
            userIds: { $push: "$_id" },
            pushTokens: { $push: "$pushToken" },
          },
        },
      ]);

      if (tribeUsers.length > 0) {
        receiverIds.push(...new Set(tribeUsers[0].userIds.map((userId) => userId.toString())));
        pushTokens.push(...new Set(tribeUsers[0].pushTokens));
      }
    }
  } else if (product.visibility === Const.productVisibilityPublic) {
    const subscribers = await User.find({
      followedBusinesses: owner._id.toString(),
      "isDeleted.value": false,
    }).lean();
    const subscriberIds = [],
      subscriberPushTokens = [];
    for (const subscriber of subscribers) {
      subscriberIds.push(subscriber._id.toString());
      subscriberPushTokens.push(...subscriber.pushToken);
    }

    const finalReceiverIds = Array.from(new Set([...receiverIds, ...subscriberIds]));
    const finalReceiverPushTokens = Array.from(new Set([...pushTokens, ...subscriberPushTokens]));

    if (finalReceiverIds.length > 0) {
      const senderId = owner._id.toString();
      const title = "New content is here, check it out!";
      await Utils.sendPushNotifications({
        pushTokens: finalReceiverPushTokens,
        pushType: Const.pushTypeNewProduct,
        info: {
          title,
          productId: product._id.toString(),
          contentType: product.type,
          from: {
            id: senderId,
            name: owner.name,
            avatar: owner.avatar,
            phoneNumber: owner.phoneNumber,
          },
        },
      });

      await Notification.create({
        title,
        referenceId: product._id.toString(),
        receiverIds: finalReceiverIds,
        senderId,
        notificationType: Const.notificationTypeProductAdded,
        notificationSubType: product.type,
      });

      await incrementUsersNotificationsUnreadCount({ userIds: finalReceiverIds });
    }
  }
};

const incrementUsersNotificationsUnreadCount = ({ userIds }) => {
  return User.updateMany(
    { _id: { $in: userIds }, "isDeleted.value": false },
    { $inc: { "notifications.unreadCount": 1 } },
  );
};

async function sendNewsletterToSubscribers({ product, owner }) {
  try {
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
    await Utils.getUsersConversionRate({
      user: request.user,
      accessToken: request.headers["access-token"],
    });

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

module.exports = router;
