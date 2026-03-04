"use strict";

const { Const } = require("#config");
const Utils = require("#utils");
const { User, Notification } = require("#models");
const mongoose = require("mongoose");

const getTribeOwnerAndCoOwners = async (tribe) => {
  return User.find({
    _id: {
      $in: [
        tribe.ownerId,
        ...tribe.members.accepted
          .filter((member) => member.role === Const.tribeMemberRoleCoOwner)
          .map((member) => member.id),
      ],
    },
  }).lean();
};

const getPushTokens = async ({ users, userIds }) => {
  userIds = userIds?.map(function (el) {
    return mongoose.Types.ObjectId(el);
  });
  if (users) {
    return [
      ...new Set(
        users.reduce((acc, curr) => {
          acc.push(...curr.pushToken);
          return acc;
        }, []),
      ),
    ];
  } else {
    const users = await User.aggregate([
      { $match: { _id: { $in: userIds } } },
      { $unwind: "$pushToken" },
      {
        $group: {
          _id: null,
          pushTokens: { $push: "$pushToken" },
        },
      },
    ]);
    if (users[0]?.pushTokens?.length > 0) {
      return [...new Set(users[0].pushTokens)];
    }
  }
  return [];
};

const saveTribeNotification = ({ title, tribeId, receiverIds, senderId, notificationType }) => {
  return Notification.create({
    title,
    referenceId: tribeId,
    receiverIds,
    senderId,
    notificationType,
  });
};

const updateTribeInviteNotification = async ({
  title,
  tribeId,
  ownerId,
  requestUserId,
  receivers,
}) => {
  const notification = await Notification.findOne({
    referenceId: tribeId,
    receiverIds: requestUserId,
    notificationType: Const.notificationTypeTribeInvite,
  });

  if (!notification) {
    return {};
  }

  notification.receiverIds = notification.receiverIds.filter((userId) => requestUserId !== userId);
  if (notification.receiverIds.length > 0) {
    await notification.save();
  } else {
    await notification.deleteOne();
  }

  const inviteReceiverNotification = await Notification.create({
    title,
    referenceId: tribeId,
    relatedNotificationId: notification._id.toString(),
    receiverIds: [requestUserId],
    senderId: notification.senderId,
    notificationType: Const.notificationTypeTribe,
  });

  const receiverIds =
    notification.senderId === ownerId ? [ownerId] : receivers.map((user) => user._id.toString());

  const inviteSenderNotification = await Notification.create({
    title,
    referenceId: tribeId,
    receiverIds,
    senderId: requestUserId,
    notificationType: Const.notificationTypeTribe,
  });

  return {
    inviteReceiverNotification: inviteReceiverNotification.toObject(),
    inviteSenderNotification: inviteSenderNotification.toObject(),
  };
};

const updateTribeRequestNotification = async ({
  title,
  tribeId,
  requestApproverUserId,
  tribeRequestUserId,
  receiverIds,
}) => {
  const notification = await Notification.findOne({
    referenceId: tribeId,
    senderId: tribeRequestUserId,
    notificationType: Const.notificationTypeTribeRequest,
  });
  await notification.deleteOne();

  const tribeRequestUserNotification = await Notification.create({
    title,
    referenceId: tribeId,
    receiverIds: [tribeRequestUserId],
    senderId: requestApproverUserId,
    notificationType: Const.notificationTypeTribe,
  });

  const receiversNotification = await Notification.create({
    title,
    referenceId: tribeId,
    relatedNotificationId: notification._id.toString(),
    receiverIds,
    senderId: tribeRequestUserId,
    notificationType: Const.notificationTypeTribe,
  });

  return {
    tribeRequestUserNotificationId: tribeRequestUserNotification._id.toString(),
    receiversNotificationId: receiversNotification._id.toString(),
  };
};

const incrementUsersNotificationsUnreadCount = (userIds) => {
  return User.updateMany({ _id: { $in: userIds } }, { $inc: { "notifications.unreadCount": 1 } });
};

const sendPushNotifications = async ({
  from,
  pushType,
  notificationId,
  tribeId,
  title,
  pushTokens,
}) => {
  for (let i = 0; i < pushTokens.length; i++) {
    await Utils.callPushService({
      pushToken: pushTokens[i],
      isVoip: false,
      unreadCount: 1,
      isMuted: false,
      payload: {
        pushType,
        info: {
          notificationId,
          tribeId,
          title,
          from,
        },
      },
    });
  }
};

const notifyInvitedTribeUsers = async ({ tribe, receivers, sender }) => {
  const tribeId = tribe._id.toString();
  const senderId = sender._id.toString();
  const title = `Invite to join ${tribe.name}`;
  const receiverIds = receivers.map((user) => user._id.toString());

  const notification = await saveTribeNotification({
    title,
    tribeId,
    receiverIds,
    senderId,
    notificationType: Const.notificationTypeTribeInvite,
  });

  const receiverPushTokens = [];
  receivers.forEach((user) => {
    if (user.pushToken) {
      receiverPushTokens.push(...user.pushToken);
    }
  });

  await incrementUsersNotificationsUnreadCount(receiverIds);

  await sendPushNotifications({
    from: {
      id: senderId,
      name: sender.name,
      phoneNumber: sender.phoneNumber,
    },
    notificationId: notification._id.toString(),
    pushType: Const.pushTypeTribeNotification,
    tribeId,
    title,
    pushTokens: receiverPushTokens,
  });
};

const updateInvitedUserNotification = async ({ tribe, userStatus, requestUser }) => {
  const tribeId = tribe._id.toString();
  const requestUserId = requestUser._id.toString();
  const ownerId = tribe.ownerId;
  const title = userStatus
    ? `Invite to join ${tribe.name} accepted`
    : `Invite to join ${tribe.name} rejected`;

  const receivers = await getTribeOwnerAndCoOwners(tribe);

  const { inviteReceiverNotification, inviteSenderNotification } =
    await updateTribeInviteNotification({
      title,
      tribeId,
      ownerId,
      requestUserId,
      receivers,
    });

  const owner = receivers.find((user) => user._id.toString() === ownerId);
  const pushNotificationData = {
    pushType: Const.pushTypeTribeNotification,
    tribeId,
    title,
  };
  if (inviteReceiverNotification) {
    await incrementUsersNotificationsUnreadCount([requestUserId]);
    const invitationSender =
      receivers.find((user) => user._id.toString() === inviteReceiverNotification.senderId) ||
      owner;
    await sendPushNotifications({
      ...pushNotificationData,
      notificationId: inviteReceiverNotification._id.toString(),
      pushTokens: requestUser.pushToken,
      from: {
        id: invitationSender._id.toString(),
        name: invitationSender.name,
        phoneNumber: invitationSender.phoneNumber,
      },
    });
  }
  if (inviteSenderNotification) {
    await incrementUsersNotificationsUnreadCount([ownerId]);
    const pushTokens = await getPushTokens({ users: receivers });

    await sendPushNotifications({
      ...pushNotificationData,
      notificationId: inviteSenderNotification._id.toString(),
      pushTokens,
      from: {
        id: requestUserId,
        name: requestUser.name,
        phoneNumber: requestUser.phoneNumber,
      },
    });
  }
};

const removeUsersFromInvitedNotification = async ({ tribe, removedUserIds }) => {
  const notifications = await Notification.find({
    referenceId: tribe._id.toString(),
    receiverIds: { $in: removedUserIds },
    notificationType: Const.notificationTypeTribeInvite,
  });

  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];
    notification.receiverIds = notification.receiverIds.filter(
      (id) => !removedUserIds.includes(id),
    );
    if (notification.receiverIds.length === 0) {
      notification.deleteOne();
    } else {
      notification.markModified("members");
      notification.save();
    }
  }
};

const notifyTribeRequest = async ({ tribe, requestUser }) => {
  const tribeId = tribe._id.toString();
  const requestUserId = requestUser._id.toString();
  const title = `Request to join ${tribe.name}`;
  const receiverIds = [
    tribe.ownerId,
    ...tribe.members.accepted.reduce((acc, curr) => {
      if (curr.role === Const.tribeMemberRoleCoOwner) {
        acc.push(curr.id);
      }
      return acc;
    }, []),
  ];

  const notification = await saveTribeNotification({
    title,
    tribeId,
    receiverIds,
    senderId: requestUserId,
    notificationType: Const.notificationTypeTribeRequest,
  });

  await incrementUsersNotificationsUnreadCount(receiverIds);

  const pushTokens = await getPushTokens({ userIds: receiverIds });
  if (pushTokens.length > 0) {
    await sendPushNotifications({
      from: {
        id: requestUserId,
        name: requestUser.name,
        phoneNumber: requestUser.phoneNumber,
      },
      notificationId: notification._id.toString(),
      pushType: Const.pushTypeTribeNotification,
      tribeId,
      title,
      pushTokens,
    });
  }
};

const updateRequestedUserNotification = async ({
  tribe,
  requestApproverUser,
  tribeRequestUserId,
  userStatus,
}) => {
  const tribeId = tribe._id.toString();
  const title = userStatus
    ? `Request to join ${tribe.name} accepted`
    : `Request to join ${tribe.name} rejected`;
  const requestApproverUserId = requestApproverUser._id.toString();
  const receivers = await getTribeOwnerAndCoOwners(tribe);
  const receiverIds = receivers.map((user) => user._id.toString());
  const tribeRequestUser = await User.findOne(
    { _id: tribeRequestUserId },
    { _id: 1, name: 1, pushToken: 1 },
  ).lean();

  const { tribeRequestUserNotificationId, receiversNotificationId } =
    await updateTribeRequestNotification({
      title,
      tribeId,
      requestApproverUserId,
      tribeRequestUserId,
      receiverIds,
    });

  await incrementUsersNotificationsUnreadCount([tribeRequestUserId, ...receiverIds]);

  const pushNotificationData = {
    pushType: Const.pushTypeTribeNotification,
    tribeId,
    title,
  };
  if (tribeRequestUser.pushToken.length > 0) {
    await sendPushNotifications({
      ...pushNotificationData,
      notificationId: tribeRequestUserNotificationId,
      pushTokens: tribeRequestUser.pushToken,
      from: {
        id: requestApproverUserId,
        name: requestApproverUser.name,
        phoneNumber: requestApproverUser.phoneNumber,
      },
    });
  }

  const pushTokens = await getPushTokens({ userIds: receiverIds });
  if (pushTokens.length > 0) {
    await sendPushNotifications({
      ...pushNotificationData,
      notificationId: receiversNotificationId,
      pushTokens,
      from: {
        id: tribeRequestUserId,
        name: tribeRequestUser.name,
        phoneNumber: tribeRequestUser.phoneNumber,
      },
    });
  }
};

const removeTribeRequestNotification = async ({ tribeId, requestUserId }) => {
  return Notification.deleteOne({
    referenceId: tribeId,
    senderId: requestUserId,
    notificationType: Const.notificationTypeTribeRequest,
  });
};

const notifyRemovedUsers = async ({ tribe, requestUser, removedUserIds }) => {
  const requestUserId = requestUser._id.toString();
  const tribeId = tribe._id.toString();
  const title = `You were removed from ${tribe.name}`;

  const removedUsersNotification = await saveTribeNotification({
    title,
    tribeId,
    receiverIds: removedUserIds,
    senderId: requestUserId,
    notificationType: Const.notificationTypeTribe,
  });
  await incrementUsersNotificationsUnreadCount(removedUserIds);

  await sendPushNotifications({
    title,
    tribeId,
    pushTokens: await getPushTokens({ userIds: removedUserIds }),
    notificationId: removedUsersNotification._id.toString(),
    pushType: Const.pushTypeTribeNotification,
    from: {
      id: requestUserId,
      name: requestUser.name,
      phoneNumber: requestUser.phoneNumber,
    },
  });

  if (requestUserId !== tribe.ownerId) {
    let ownerAndCoOwners = await getTribeOwnerAndCoOwners(tribe);
    ownerAndCoOwners = ownerAndCoOwners.filter((user) => user._id.toString() !== requestUserId);
    const ownerAndCoOwnersIds = ownerAndCoOwners.map((user) => user._id.toString());
    const ownerAndCoOwnersPushTokens = await getPushTokens({ users: ownerAndCoOwners });

    const removedUsers = await User.find({ _id: { $in: removedUserIds } }, { name: 1 }).lean();
    const removedUsersObj = removedUsers.reduce(
      (acc, user) => (acc[user._id.toString()] = user.name),
      {},
    );

    for (let i = 0; i < removedUserIds.length; i++) {
      const title = `${removedUsersObj} was removed from ${tribe.name}`;

      const removedUserNotification = await saveTribeNotification({
        title,
        tribeId,
        receiverIds: ownerAndCoOwnersIds,
        senderId: requestUserId,
        notificationType: Const.notificationTypeTribe,
      });

      await sendPushNotifications({
        title,
        tribeId,
        pushTokens: ownerAndCoOwnersPushTokens,
        notificationId: removedUserNotification._id.toString(),
        pushType: Const.pushTypeTribeNotification,
        from: {
          id: requestUserId,
          name: requestUser.name,
          phoneNumber: requestUser.phoneNumber,
        },
      });
    }

    await incrementUsersNotificationsUnreadCount(ownerAndCoOwnersIds);
  }
};

const notifyUserLeft = async ({ tribe, user }) => {
  const title = `Member left ${tribe.name}`;
  const tribeId = tribe._id.toString();
  const userId = user._id.toString();

  const ownerAndCoOwners = await getTribeOwnerAndCoOwners(tribe);
  const ownerAndCoOwnersIds = ownerAndCoOwners.map((user) => user._id.toString());

  const notification = await saveTribeNotification({
    title,
    tribeId,
    receiverIds: ownerAndCoOwnersIds,
    senderId: userId,
    notificationType: Const.notificationTypeTribe,
  });

  await incrementUsersNotificationsUnreadCount([userId, ...ownerAndCoOwnersIds]);

  await sendPushNotifications({
    title,
    tribeId,
    pushTokens: await getPushTokens({ users: ownerAndCoOwners }),
    notificationId: notification._id.toString(),
    pushType: Const.pushTypeTribeNotification,
    from: {
      id: userId,
      name: user.name,
      phoneNumber: user.phoneNumber,
    },
  });
};

const notifyTribeDeleted = async ({ tribe, owner }) => {
  const tribeId = tribe._id.toString();
  const ownerId = tribeId.ownerId;
  const title = `${tribe.name} is deleted`;

  await Notification.deleteMany({
    referenceId: tribeId,
    notificationType: {
      $in: [Const.notificationTypeTribeInvite, Const.notificationTypeTribeRequest],
    },
  });

  const membersToNotifyIds = tribe.members.accepted.map((member) => member.id);
  if (membersToNotifyIds.length > 0) {
    const membersToNotifyPushTokens = await getPushTokens({ userIds: membersToNotifyIds });

    const notification = await saveTribeNotification({
      title,
      tribeId,
      receiverIds: membersToNotifyIds,
      senderId: ownerId,
      notificationType: Const.notificationTypeTribe,
    });

    await incrementUsersNotificationsUnreadCount(membersToNotifyIds);

    await sendPushNotifications({
      title,
      tribeId,
      pushTokens: membersToNotifyPushTokens,
      notificationId: notification._id.toString(),
      pushType: Const.pushTypeTribeNotification,
      from: {
        id: ownerId,
        name: owner.name,
        phoneNumber: owner.phoneNumber,
      },
    });
  }
};

module.exports = {
  notifyInvitedTribeUsers,
  updateInvitedUserNotification,
  removeUsersFromInvitedNotification,
  notifyTribeRequest,
  updateRequestedUserNotification,
  removeTribeRequestNotification,
  notifyRemovedUsers,
  notifyUserLeft,
  notifyTribeDeleted,
};
