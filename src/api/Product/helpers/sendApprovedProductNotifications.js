"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { Notification, User, Tribe } = require("#models");

const sendNotifications = async function ({ product, owner }) {
  try {
    if (
      product.moderation.status !== Const.moderationStatusApproved &&
      product.moderation.status !== Const.moderationStatusRejected
    ) {
      return;
    }

    const sender = await User.findOne({ _id: Config.flomSupportAgentId }).lean();

    await notifyProductOwner({ product, owner, sender });

    if (product.moderation.status === Const.moderationStatusApproved) {
      await notifyTribeMembersAndSubscribers({ product, owner });
    }
  } catch (error) {
    logger.error("sendApprovedProductNotifications error", error);
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

module.exports = sendNotifications;
