"use strict";

const { Const } = require("#config");
const Utils = require("#utils");
const { User } = require("#models");

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
        checkedUserIds.push(Utils.createObjectId(rawUserIds[i]));
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

module.exports = getUserIds;
