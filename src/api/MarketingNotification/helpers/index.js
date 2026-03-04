"use strict";

const { Const } = require("#config");
const Utils = require("#utils");
const { Product, User } = require("#models");

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
  if (Const.productTypes.indexOf(contentType) !== -1) {
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

async function getUserIds({ requestUserId, allSubscribers, requestUserIds }) {
  const userIds = [];
  const userPushTokens = [];
  if (allSubscribers) {
    const allSubscribedUsers = await User.aggregate([
      { $match: { followedBusinesses: requestUserId } },
      { $unwind: { path: "$pushToken", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          userIds: { $push: "$_id" },
          pushTokens: { $push: "$pushToken" },
        },
      },
    ]);
    if (allSubscribedUsers.length) {
      userIds.push(...new Set(allSubscribedUsers[0].userIds.map((userId) => userId.toString())));
      userPushTokens.push(...new Set(allSubscribedUsers[0].pushTokens));
    }
  } else {
    if (!requestUserIds) {
      return {
        code: Const.responsecodeNoUserIds,
        message: `no userIds parameter`,
      };
    }

    const rawUserIds = requestUserIds.split(",") || [];
    const checkedUserIds = [];
    for (let i = 0; i < rawUserIds.length; i++) {
      if (Utils.isValidObjectId(rawUserIds[i])) {
        checkedUserIds.push(Utils.toObjectId(rawUserIds[i]));
      }
    }

    if (checkedUserIds.length) {
      const usersFromDb = await User.aggregate([
        {
          $match: {
            _id: { $in: checkedUserIds },
            followedBusinesses: requestUserId,
          },
        },
        { $unwind: { path: "$pushToken", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: null,
            userIds: { $push: "$_id" },
            pushTokens: { $push: "$pushToken" },
          },
        },
      ]);

      if (usersFromDb.length) {
        const userIdsString = usersFromDb[0].userIds.map((userId) => userId.toString());
        userIds.push(...new Set(userIdsString));
        userPushTokens.push(...new Set(usersFromDb[0].pushTokens));
      }
    }
  }

  if (userIds.length === 0) {
    return {
      code: Const.responsecodeUserIdsEmpty,
      message: `userIds empty`,
    };
  }

  return { userIds, userPushTokens };
}

module.exports = { validateMarketingNotificationData, getUserIds };
