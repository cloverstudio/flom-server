"use strict";

const { Const } = require("#config");
const Utils = require("#utils");
const { Product } = require("#models");
const getUserIds = require("./getUserIds");

async function validateMarketingNotificationData({
  requestUserId,
  title,
  allSubscribers,
  requestUserIds,
  contentType,
  requestContentId,
}) {
  if (!title || title == "") {
    return {
      code: Const.responsecodeNoTitle,
      message: `no title parameter`,
    };
  }

  const { code, message, userIds, userPushTokens } = await getUserIds({
    requestUserId,
    allSubscribers,
    requestUserIds,
  });

  if (code) {
    return { code, message };
  }

  if (!contentType) {
    return {
      code: Const.responsecodeNoContentType,
      message: `no contentType parameter`,
    };
  }
  if (Const.marketingNotificationsContentTypes.indexOf(contentType) === -1) {
    return {
      code: Const.responsecodeNoContentType,
      message: `wrong contentType parameter`,
    };
  }

  let contentId, contentName;
  if (
    Const.productTypes.indexOf(contentType) !== -1 ||
    contentType == Const.marketingNotificationsContentTypeService
  ) {
    if (contentType == Const.marketingNotificationsContentTypeService) {
      contentType = Const.productTypeService;
    }

    if (!requestContentId) {
      return {
        code: Const.responsecodeNoContentId,
        message: `no contentId parameter`,
      };
    }
    if (!Utils.isValidObjectId(requestContentId)) {
      return {
        code: Const.responsecodeInvalidObjectId,
        message: `contentId is not valid`,
      };
    }

    const product = await Product.findOne(
      {
        _id: requestContentId,
        type: contentType,
        ownerId: requestUserId,
        "moderation.status": Const.moderationStatusApproved,
      },
      { _id: 1, name: 1 },
    ).lean();
    if (!product) {
      return {
        code: Const.responsecodeProductNotFound,
        message: `product not found`,
      };
    }
    contentId = product._id.toString();
    contentName = product.name;
  } else if (contentType === Const.marketingNotificationsContentTypeProfile) {
    contentId = requestUserId;
  } else if (contentType === Const.marketingNotificationsContentTypeMarketplace) {
    contentId = requestUserId;
  }

  return { userIds, userPushTokens, contentId, contentName };
}

module.exports = validateMarketingNotificationData;
