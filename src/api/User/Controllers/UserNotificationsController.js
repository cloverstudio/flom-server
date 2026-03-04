"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const {
  User,
  Product,
  Room,
  MarketingNotification,
  Notification,
  RequestTransfer,
  GroupRequestTransfer,
  Transfer,
  GroupTransfer,
  Payout,
} = require("#models");
const { Localizer } = require("#services");

let loc;

/**
 * @api {get} /api/v2/users/notifications Users notifications flom_v1
 * @apiVersion 2.0.10
 * @apiName Users notifications flom_v1
 * @apiGroup WebAPI User
 * @apiDescription Returns list of users notifications (transfer, request transfer and marketing notifications). Each notification can have notificationType:
 * 1 - transfer notification, 2 - request transfer notification, 3 - marketing notification, 4 - marketplace transfer, 5 - tribe, 6 - tribe invite, 7 tribe request,
 * 8 - product approved, 9 - product rejected, 10 - product added.
 * Transfer notification status can be: 1 - Pretransfer, 2 - Waiting for fulfillment, 3 - Completed, 4 - Fulfillment failed, 5 - Payment failed. Request transfer notifications have status:
 * 101 - pending and 102 - rejected. Transfer and request transfer notifications have either "from" or "to" field, with a phone number, depending on if you
 * sent something to that number or you received something from that number. From can be "Guest" if the transfer was from the web app. If notification is transfer
 * notification then referenceId is transferId and if notification is request transfer notification then referenceId is requestTransferId. Paging is 10 per page.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1640158122864,
 *   "data": {
 *     "notifications": [
 *       {
 *         "notificationType": 1,
 *         "referenceId": "61c1c02bb493838cbe95c555",
 *         "created": 1640087595170,
 *         "status": 3,
 *         "to": "+2348020000005",
 *         "title": "Super Bless sent"
 *         "userName": "+2348*****0005"
 *       },
 *       {
 *         "notificationType": 1,
 *         "referenceId": "61c1b93f163b877b852b1ebb",
 *         "created": 1640085823691,
 *         "status": 5,
 *         "to": "+2348020000005",
 *         "title": "Super Bless failed"
 *         "userName": "+2348*****0005"
 *       },
 *       {
 *         "notificationType": 1,
 *         "referenceId": "619caddfff856461b41e56ad",
 *         "created": 1637658079480,
 *         "status": 3,
 *         "to": "+2348020000005",
 *         "title": "Top Up sent"
 *         "userName": "+2348*****0005"
 *       },
 *       {
 *         "notificationType": 1,
 *         "referenceId": "619cadcbff856461b41e56ac",
 *         "created": 1637658059891,
 *         "status": 5,
 *         "to": "+2348020000005",
 *         "title": "Top Up failed"
 *         "userName": "+2348*****0005"
 *       },
 *       {
 *         "notificationType": 1,
 *         "referenceId": "6197c7b58fd1d73019cf3b35",
 *         "created": 1637337013195,
 *         "status": 3,
 *         "from": "+2348020000003",
 *         "title": "Top Up received"
 *         "userName": "+2348*****0003"
 *       },
 *       {
 *         "notificationType": 1,
 *         "referenceId": "6194e4984512aa8060b5f22f",
 *         "created": 1637147800466,
 *         "status": 5,
 *         "to": "+2348020000005",
 *         "title": "Top Up canceled"
 *         "userName": "+2348*****0005"
 *       },
 *       {
 *         "notificationType": 2,
 *         "referenceId": "6194ec919b626a941af43bb1",
 *         "created": 1637149841657,
 *         "status": 101,
 *         "from": "+2348020000005",
 *         "title": "Top-Up request rejected"
 *         "userName": "+2348*****0005"
 *       },
 *       {
 *         "notificationType": 3
 *         "_id": "618a66eae552c64dee7a6bfe",
 *         "created": 1636460266763,
 *         "title": "dkdjsaaaaavvg",
 *         "text": "B ",
 *         "senderId": "60e4384b560d1466637e3eca",
 *         "contentType": 5,
 *         "contentId": "616e8f9a8da85564d0ed4780",
 *         "userName": "mer19"
 *       },
 *       {
 *         "notificationType": 4,
 *         "referenceId": "61f930d0dbc98a20f502d3c8",
 *         "created": 1643720912888,
 *         "status": 3,
 *         "to": "+2348020000005",
 *         "text": "1 x HyperX - CloudX Flight Wireless Stereo Gaming Headset - Black",
 *         "title": "Purchase complete"
 *       },
 *       {
 *         "_id": "620216ace183032cf81c51ea",
 *         "created": 1644304044721,
 *         "title": "You were removed from The Greatest Tribe 7",
 *         "referenceId": "62021566d66505269dbb08ed", // tribe id
 *         "senderId": "5f7ee464a283bc433d9d722f",
 *         "notificationType": 5, //same model for notification type 6 and 7
 *         "userName": "mdragic"
 *       },
 *       {
 *         "_id": "6225ec83b07e74c7cdab9fc0",
 *         "created": 1646652547766,
 *         "title": "Tribe Notif Vid 2 has been approved",
 *         "referenceId": "6225c59ce94bd4585df09e72",
 *         "senderId": "5e08f8029d384b04a30b23aa",
 *         "notificationType": 8, //same model for notification type 9 and 10
 *         "notificationSubType": 1, //type of the product (same as content type in push notification)
 *         "userName": "FLOM"
 *       },
 *       {
 *         "_id": "6225ec83b07e74c7cdab9fc0",
 *         "created": 1646652547766,
 *         "title": "Member canceled VIP plan",
 *         "referenceId": "6225c59ce94bd4585df09e72",
 *         "senderId": "5e08f8029d384b04a30b23aa",
 *         "notificationType": 11,
 *         "userName": "FLOM"
 *       },
 *     ],
 *     "total": 11,
 *     "hasNext": false
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.user._id.toString();
    const page = +request.query.page || 1;
    const deviceLanguage = request.user.deviceLanguage;
    loc = new Localizer(deviceLanguage);

    const notifications = await getNotifications({
      userId,
      userPhoneNumber: request.user.phoneNumber,
    });

    const notificationWithPagination = notifications.slice(
      (page - 1) * Const.newPagingRows,
      page * Const.newPagingRows,
    );

    const notificationsWithUserNames = await addUserNameToNotifications(notificationWithPagination);

    if (page === 1) {
      if (!request.user.notifications) {
        request.user.notifications = { timestamp: 0, unreadCount: 0 };
      }

      if (
        request.user.notifications.timestamp === undefined ||
        request.user.notifications.timestamp < notificationsWithUserNames[0]?.created
      ) {
        request.user.notifications.timestamp = notificationsWithUserNames[0].created;
        request.user.notifications.unreadCount = 0;
      }
      await User.findByIdAndUpdate(userId, { notifications: request.user.notifications });
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      notifications: notificationsWithUserNames,
      total: notifications.length,
      hasNext: page * Const.newPagingRows < notifications.length,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserNotificationController error",
      error,
    });
  }
});

async function getNotifications({ userId, userPhoneNumber }) {
  const marketingNotifications = await getMarketingNotifications(userId);

  const transferNotifications = await getTransferNotifications({
    userId,
    userPhoneNumber,
  });

  const marketplaceTransferNotifications = await getMarketplaceTransferNotifications({
    userId,
    userPhoneNumber,
  });

  const requestTransferNotifications = await getRequestTransferNotifications({
    userId,
    userPhoneNumber,
  });

  const notificationsFromDb = await getNotificationsFromDb(userId);

  const membershipNotifications = await getMembershipNotifications(userId);

  const payoutNotifications = await getPayoutNotifications(userId);

  const notifications = [
    ...marketingNotifications,
    ...transferNotifications,
    ...marketplaceTransferNotifications,
    ...requestTransferNotifications,
    ...notificationsFromDb,
    ...membershipNotifications,
    ...payoutNotifications,
  ];

  notifications.sort((a, b) => b.created - a.created);

  return notifications;
}

async function getMarketingNotifications(userId) {
  return MarketingNotification.find(
    { receivers: userId },
    {
      _id: 1,
      title: 1,
      text: 1,
      notificationType: 1,
      senderId: 1,
      created: 1,
      contentType: 1,
      contentId: 1,
    },
  ).lean();
}

async function getTransferNotifications({ userId, userPhoneNumber }) {
  const singleTransfers = await Transfer.find({
    transferType: {
      $in: [
        Const.transferTypeTopUp,
        Const.transferTypeData,
        Const.transferTypeSuperBless,
        Const.transferTypeCash,
        Const.transferTypeCreditPackage,
        Const.transferTypeCredits,
        Const.transferTypeSprayBless,
        Const.transferTypeSats,
        Const.transferTypeSatsPurchase,
        Const.transferTypeMediaContent,
        Const.transferTypeDirectCash,
      ],
    },
    $or: [
      { senderId: userId, status: { $ne: Const.transferPrepayment }, multi: false },
      {
        receiverPhoneNumber: userPhoneNumber,
        status: Const.transferComplete,
      },
    ],
  }).lean();

  const groupTransfers = await GroupTransfer.find({
    transferType: {
      $in: [
        Const.transferTypeTopUp,
        Const.transferTypeData,
        Const.transferTypeCash,
        Const.transferTypeCredits,
        Const.transferTypeSats,
        Const.transferTypeDirectCash,
      ],
    },
    senderId: userId,
    status: { $ne: Const.transferPrepayment },
  }).lean();

  let groupTransfersReceivers = [];
  for (let i = 0; i < groupTransfers.length; i++)
    groupTransfersReceivers = [...groupTransfersReceivers, ...groupTransfers[i].receivers];
  const groupTransfersPhoneNumbers = groupTransfersReceivers.map(
    (receiver) => receiver.phoneNumber,
  );
  const uniqueGroupTransfersPhoneNumbers = groupTransfersPhoneNumbers.filter((element, index) => {
    return index === groupTransfersPhoneNumbers.indexOf(element);
  });
  const groupTransferReceivers = await User.find(
    { phoneNumber: { $in: uniqueGroupTransfersPhoneNumbers } },
    { userName: 1, phoneNumber: 1 },
  ).lean();
  let formattedGroupReceivers = {};
  for (let i = 0; i < groupTransferReceivers.length; i++) {
    formattedGroupReceivers[groupTransferReceivers[i].phoneNumber] =
      groupTransferReceivers[i].userName;
  }

  let transfers = [...singleTransfers, ...groupTransfers];
  let transferNotificationList = [];
  if (transfers.length) {
    for (let i = 0; i < transfers.length; i++) {
      if (!transfers[i].created) transfers[i].created = 0;
      const { status, transferType, created, senderId, bonusType = null } = transfers[i];
      const notificationData = {
        notificationType: Const.notificationTypeTransfer,
        referenceId: transfers[i]._id.toString(),
        created,
        status,
        transferType,
      };
      if (transfers[i].productId) {
        notificationData.contentId = transfers[i].productId;
        if (transferType === Const.transferTypeSuperBless) {
          const product = await Product.findOne({ _id: transfers[i].productId }).lean();
          notificationData.contentType = product.type;
        }
      }

      let title = "";
      let isGroupPayment = false;
      let isSentGroupPayment = false;

      switch (transferType) {
        case Const.transferTypeTopUp:
          title += "Top-up ";
          break;
        case Const.transferTypeData:
          title += "Data ";
          break;
        case Const.transferTypeSuperBless:
          title += "Super Bless ";
          break;
        case Const.transferTypeCash:
          title += "Cash ";
          break;
        case Const.transferTypeCreditPackage:
          title += "Credit package ";
          break;
        case Const.transferTypeCredits:
          title += !bonusType ? "Credits " : transfers[i].productName + " ";
          break;
        case Const.transferTypeSprayBless:
          title += "Credits ";
          break;
        case Const.transferTypeSats:
          title += !bonusType ? "Sats " : transfers[i].productName + " ";
          break;
        case Const.transferTypeSatsPurchase:
          title += "Sats purchase ";
          break;
        case Const.transferTypeMediaContent:
          title += "Media content ";
          break;
        case Const.transferTypeDirectCash:
          title += "Local transfer ";
          break;
      }

      if (senderId === userId && transferType !== Const.transferTypeCreditPackage) {
        if (status === Const.transferWaitingForFulfillment) {
          title += loc.s(Const.stringpending);
        } else if (
          status === Const.transferComplete &&
          transferType !== Const.transferTypeSatsPurchase
        ) {
          title += loc.s(Const.stringsent);
        } else if (
          status === Const.transferComplete &&
          transferType === Const.transferTypeSatsPurchase
        ) {
          title += loc.s(Const.stringcompleted);
        } else {
          if (transfers[i].paymentProcessingInfo?.payPalCanceled) {
            title += loc.s(Const.stringcanceled);
          } else {
            title += loc.s(Const.stringfailed);
          }
        }
        if (transfers[i].receiverPhoneNumber)
          notificationData.to =
            transfers[i].receiverPhoneNumber === "Global"
              ? transfers[i].lightningAppName ?? "Internet"
              : transfers[i].receiverPhoneNumber === "Local"
              ? "Local"
              : transfers[i].receiverPhoneNumber;
        else if (transfers[i].receivers?.length > 0) {
          const roomIdArray = !transfers[i].roomId ? null : transfers[i].roomId.split("-");
          const roomId = !roomIdArray ? null : roomIdArray[roomIdArray.length - 1];
          let transferRoom;
          try {
            transferRoom = !roomId ? null : await Room.findOne({ _id: roomId }).lean();
          } catch (error) {}
          notificationData.to = !transferRoom ? loc.s(Const.stringGroup_chat) : transferRoom.name;
        }
      } else {
        title += loc.s(Const.stringreceived);
        if (!transfers[i].senderId || transfers[i].senderPhoneNumber === "Guest")
          notificationData.from = loc.s(Const.stringGuest_user);
        else if (transfers[i].senderId === "Global")
          notificationData.from = transfers[i].lightningAppName ?? "Internet";
        else if (transfers[i].senderId === "Local") notificationData.from = "Local";
        else notificationData.from = transfers[i].senderPhoneNumber;
      }

      if (transfers[i].multi) isGroupPayment = false;
      if (transfers[i].receivers?.length > 0) isSentGroupPayment = true;

      notificationData.title = title;
      notificationData.isGroupPayment = isGroupPayment;
      notificationData.isSentGroupPayment = isSentGroupPayment;

      transferNotificationList.push(notificationData);
    }
  }

  return transferNotificationList;
}

async function getMarketplaceTransferNotifications({ userId, userPhoneNumber }) {
  const transfers = await Transfer.find({
    transferType: Const.transferTypeMarketplace,
    $or: [
      { senderId: userId, status: { $ne: Const.transferPrepayment } },
      {
        receiverPhoneNumber: userPhoneNumber,
        status: Const.transferComplete,
      },
    ],
  }).lean();

  let transferNotificationList = [];
  if (transfers.length) {
    transferNotificationList = transfers.map((transfer) => {
      const { status, transferType, created, senderId } = transfer;
      const notificationData = {
        notificationType: Const.notificationTypeMarketplaceTransfer,
        referenceId: transfer._id.toString(),
        created,
        status,
      };
      let title = loc.s(Const.stringPurchase_);

      if (senderId === userId) {
        if (status === Const.transferWaitingForFulfillment) {
          title += loc.s(Const.stringpending);
        } else if (status === Const.transferComplete) {
          title += loc.s(Const.stringcomplete);
        } else {
          if (transfer.paymentProcessingInfo?.payPalCanceled) {
            title += loc.s(Const.stringcanceled);
          } else {
            title += loc.s(Const.stringfailed);
          }
        }
        notificationData.to = transfer.receiverPhoneNumber;
      } else {
        title = loc.s(Const.stringNew_purchase);
        notificationData.from = transfer.senderPhoneNumber;
      }

      if (transferType === Const.transferTypeMarketplace) {
        notificationData.text = transfer.basket
          .map((item) => item.quantity + " x " + item.name)
          .join(",");
      }
      notificationData.title = title;

      return notificationData;
    });
  }

  return transferNotificationList;
}

async function getRequestTransferNotifications({ userId, userPhoneNumber }) {
  const singleRequestTransfers = await RequestTransfer.find({
    $or: [
      { requestReceiverId: userId },
      { requestSenderPhoneNumber: userPhoneNumber, multi: false },
    ],
  }).lean();

  const groupRequestTransfers = await GroupRequestTransfer.find({
    requestSenderPhoneNumber: userPhoneNumber,
  }).lean();

  let groupRequestTransfersReceivers = [];
  for (let i = 0; i < groupRequestTransfers.length; i++)
    groupRequestTransfersReceivers = [
      ...groupRequestTransfersReceivers,
      ...groupRequestTransfers[i].requestReceivers,
    ];
  const groupRequestTransfersPhoneNumbers = groupRequestTransfersReceivers.map(
    (receiver) => receiver.phoneNumber,
  );
  const uniqueGroupRequestTransfersPhoneNumbers = groupRequestTransfersPhoneNumbers.filter(
    (element, index) => {
      return index === groupRequestTransfersPhoneNumbers.indexOf(element);
    },
  );
  const groupRequestTransferReceivers = await User.find(
    { phoneNumber: { $in: uniqueGroupRequestTransfersPhoneNumbers } },
    { userName: 1, phoneNumber: 1 },
  ).lean();
  let formattedGroupRequestReceivers = {};
  for (let i = 0; i < groupRequestTransferReceivers.length; i++) {
    formattedGroupRequestReceivers[groupRequestTransferReceivers[i].phoneNumber] =
      groupRequestTransferReceivers[i].userName;
  }

  let requestTransfers = [...singleRequestTransfers, ...groupRequestTransfers];
  let requestTransferNotificationList = [];
  if (requestTransfers.length) {
    for (let i = 0; i < requestTransfers.length; i++) {
      const { status, transferType, created } = requestTransfers[i];
      const notificationData = {
        notificationType: Const.notificationTypeRequestTransfer,
        referenceId: requestTransfers[i]._id.toString(),
        created,
        status,
      };
      let title = "";
      let isGroupRequest = false;
      let isSentGroupRequest = false;

      switch (transferType) {
        case 1:
          title += `Top-up ${loc.s(Const.stringrequest)} `;
          break;
        case 2:
          title += `Data ${loc.s(Const.stringrequest)} `;
          break;
        case 6:
        case 13:
          title += `Cash ${loc.s(Const.stringrequest)} `;
          break;
        case 8:
          title += `Credits ${loc.s(Const.stringrequest)} `;
          break;
        case 10:
          title += `Sats ${loc.s(Const.stringrequest)} `;
          break;
      }

      if (status === Const.requestTransferPending) {
        title += loc.s(Const.stringpending);
      } else {
        title += loc.s(Const.stringrejected);
      }

      if (requestTransfers[i].requestReceivers?.length > 0) {
        const roomIdArray = !requestTransfers[i].roomId
          ? null
          : requestTransfers[i].roomId.split("-");
        const roomId = !roomIdArray ? null : roomIdArray[roomIdArray.length - 1];
        let transferRoom;
        try {
          transferRoom = !roomId ? null : await Room.findOne({ _id: roomId }).lean();
        } catch (error) {}
        notificationData.to = !transferRoom ? loc.s(Const.stringGroup_chat) : transferRoom.name;
        notificationData.roomId = !roomId || !transferRoom ? null : roomId;
      } else {
        if (requestTransfers[i].requestReceiverId === userId) {
          notificationData.from = requestTransfers[i].requestSenderPhoneNumber;
          const counterpartUser = await User.findOne({
            phoneNumber: requestTransfers[i].requestSenderPhoneNumber,
          }).lean();
          notificationData.userId = counterpartUser?._id;
        } else {
          notificationData.to = requestTransfers[i].requestReceiverPhoneNumber;
          notificationData.userId = requestTransfers[i].requestReceiverId;
        }
      }

      if (requestTransfers[i].multi) isGroupRequest = false;
      if (requestTransfers[i].requestReceivers?.length > 0) isSentGroupRequest = true;

      notificationData.title = title;
      notificationData.isGroupRequest = isGroupRequest;
      notificationData.isSentGroupRequest = isSentGroupRequest;

      requestTransferNotificationList.push(notificationData);
    }
  }

  return requestTransferNotificationList;
}

async function getNotificationsFromDb(userId) {
  const notifications = await Notification.find({ receiverIds: userId }).lean();
  notifications.forEach((notification) => {
    delete notification.receiverIds;
    delete notification.__v;
  });
  return notifications;
}

async function getMembershipNotifications(userId) {
  const notifications = await Notification.find({
    senderId: userId,
    notificationType: Const.notificationTypeMemberships,
  }).lean();
  notifications.forEach((notification) => {
    delete notification.receiverIds;
    delete notification.__v;
    const title = notification.title;
    if (title.startsWith("New member in "))
      notification.title = title
        .replace("New member in ", loc.s(Const.stringYou_joined_))
        .concat("", " plan");
    if (title.startsWith("Member canceled "))
      notification.title = title
        .replace("Member canceled ", loc.s(Const.stringYou_canceled_))
        .concat("", " plan");
    if (title.startsWith("Member updated to "))
      notification.title = title
        .replace("Member updated to ", loc.s(Const.stringYou_updated_to_))
        .concat("", " plan");
  });
  return notifications;
}

async function getPayoutNotifications(userId) {
  const payouts = await Payout.find({
    receiverId: userId,
    source: "flom_v1",
    status: { $in: [Const.payoutComplete, Const.payoutFailed] },
  }).lean();

  const formattedPayoutNotifications = payouts.map((payout) => {
    let title = loc.s(Const.stringPayout_);
    switch (payout.status) {
      case Const.payoutFailed:
        title += loc.s(Const.stringfailed);
        break;
      case Const.payoutComplete:
        title += loc.s(Const.stringsuccessful);
        break;
    }
    return {
      notificationType: Const.notificationTypePayout,
      referenceId: payout._id.toString(),
      receiverId: payout.receiverId,
      title,
      created: payout.created,
      status: payout.status,
      userName: "FLOM",
    };
  });

  return formattedPayoutNotifications;
}

async function addUserNameToNotifications(notifications) {
  const userIdsSet = new Set();
  const userPhoneNumbersSet = new Set();

  notifications.forEach((notification) => {
    const { notificationType } = notification;
    if (
      notificationType === Const.notificationTypeMarketing ||
      Const.notificationTypesFromDb.indexOf(notificationType) !== -1
    ) {
      if (notification.senderId) {
        userIdsSet.add(notification.senderId);
      }
    } else if (
      [
        Const.notificationTypeTransfer,
        Const.notificationTypeRequestTransfer,
        Const.notificationTypeMarketplaceTransfer,
      ].indexOf(notificationType) !== -1
    ) {
      if (
        notification.from &&
        notification.from !== "Guest user" &&
        notification.from !== "Global user" &&
        notification.from !== "Local"
      ) {
        userPhoneNumbersSet.add(notification.from);
      } else if (notification.to !== "Global user" && notification.to !== "Local") {
        userPhoneNumbersSet.add(notification.to);
      }
    }
  });

  const userIds = [...userIdsSet].map((userId) => Utils.toObjectId(userId));

  const users = await User.find(
    {
      $or: [{ _id: { $in: userIds } }, { phoneNumber: { $in: [...userPhoneNumbersSet] } }],
    },
    { phoneNumber: 1, name: 1 },
  ).lean();

  const userNames = users.reduce((acc, user) => {
    const userId = user._id.toString();
    if (!acc[userId]) {
      acc[userId] = user.name;
    }
    if (!acc[user.phoneNumber]) {
      acc[user.phoneNumber] = user.name;
    }
    return acc;
  }, {});

  notifications.forEach((notification) => {
    const notificationType = notification.notificationType;
    if (
      notificationType === Const.notificationTypeMarketing ||
      Const.notificationTypesFromDb.indexOf(notificationType) !== -1
    ) {
      notification.userName = userNames[notification.senderId];
    } else if (
      [
        Const.notificationTypeTransfer,
        Const.notificationTypeRequestTransfer,
        Const.notificationTypeMarketplaceTransfer,
      ].indexOf(notificationType) !== -1
    ) {
      if (!notification.isSentGroupPayment && !notification.isSentGroupRequest)
        notification.userName = "";
      if (notification.from) {
        if (userNames[notification.from]) {
          notification.userName = userNames[notification.from];
        } else if (notification.from === "Guest user") {
          notification.userName = loc.s(Const.stringGuest_user);
        } else {
          notification.userName = notification.from;
        }
      } else if (notification.to) {
        if (
          userNames[notification.to] &&
          !notification.isSentGroupPayment &&
          !notification.isSentGroupRequest
        ) {
          notification.userName = userNames[notification.to];
        } else {
          notification.userName = notification.to;
        }
      }
    }
  });

  return notifications;
}

module.exports = router;
