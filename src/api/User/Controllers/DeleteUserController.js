"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const {
  User,
  RecurringPayment,
  Product,
  Tribe,
  Membership,
  Notification,
  Room,
} = require("#models");

/**
 * @api {get} /api/v2/user/delete-account Delete account API
 * @apiVersion 0.0.1
 * @apiName Delete account API
 * @apiGroup WebAPI User
 * @apiDescription API for deleting users account.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 400272 User already deleted
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const token = request.headers["access-token"];

    const user = request.user || (await User.findOne({ "token.token": token }).lean());
    const userId = user._id.toString();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "DeleteUserController, invalid user token",
      });
    }

    if (user?.isDeleted.value) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserAlreadyDeleted,
        message: "DeleteUserController, user already deleted",
      });
    }

    const updateObj = {
      modified: Date.now(),
      isDeleted: {
        value: true,
        created: Date.now(),
      },
      deletedUserInfo: {
        phoneNumber: user.phoneNumber,
        userName: user.userName,
        name: user.name,
        bankAccounts: user.bankAccounts,
      },
      phoneNumber: "Deleted_user_" + user.phoneNumber + "_" + Date.now().toString(),
      userName: "Deleted_user_" + user.phoneNumber + "_" + Date.now().toString(),
      name: "Deleted_user_" + user.phoneNumber + "_" + Date.now().toString(),
      bankAccounts: [],
    };

    await User.updateOne({ _id: user._id }, updateObj);

    await Product.updateMany({ ownerId: user._id }, { $set: { isDeleted: true } });

    // remove user from rooms he is in
    const roomPromises = [];
    const roomsUserIsIn = await Room.find({
      $or: [{ users: userId }, { admins: userId }],
    }).lean();

    roomsUserIsIn.forEach((room) => {
      if (room.users.includes(userId)) {
        const newArray = room.users.filter((id) => id !== userId);
        roomPromises.push(Room.updateOne({ _id: room._id.toString() }, { users: newArray }));
      }
      if (room.admins.includes(userId)) {
        const newArray = room.admins.filter((id) => id !== userId);
        roomPromises.push(Room.updateOne({ _id: room._id.toString() }, { admins: newArray }));
      }
    });

    await Promise.all(roomPromises);

    // remove user from recurring payments he's in
    const reccurings = await RecurringPayment.find({ userId: user._id, status: 2 }).lean();
    if (reccurings.length > 0) {
      var data;

      reccurings?.map(async (reccuring) => {
        const apiResponse = await Utils.sendRequest({
          method: "POST",
          url: Config.paymentServiceBaseUrl + "/api/v2/recurring-payments/memberships/cancel",
          headers: {
            "access-token": token,
            "content-type": "application/json",
          },
          body: { recurringPaymentId: reccuring._id.toString() },
        });

        var dataCopy = apiResponse;

        if (dataCopy?.code !== 1) {
          data = dataCopy;
        }
      });

      if (data && data?.code !== 1) {
        return Base.newErrorResponse({
          response,
          code: data?.code,
          message:
            data.errorMessage ||
            `DeleteUserController, cancel membership recurring payment - payment service response`,
        });
      }
    }

    const userTribes = await Tribe.find({ ownerId: user._id.toString() }).lean();

    var tribeCoowners = [];
    var tribeElders = [];
    var tribeMembers = [];

    for (const tribe of userTribes) {
      tribeCoowners = [];
      tribeElders = [];
      tribeMembers = [];
      tribe.members.accepted.forEach((member) => {
        if (member.role === 3) {
          tribeCoowners.push(member);
        } else if (member.role === 2) {
          tribeElders.push(member);
        } else {
          tribeMembers.push(member);
        }
      });
      if (tribeCoowners.length > 0) {
        await Tribe.findOneAndUpdate(
          { _id: tribe._id.toString() },
          { $set: { ownerId: tribeCoowners[0].id } },
        );
        tribeCoowners = tribeCoowners.slice(1, tribeCoowners.length);
      } else if (tribeElders.length > 0) {
        await Tribe.findOneAndUpdate(
          { _id: tribe._id.toString() },
          { $set: { ownerId: tribeElders[0].id } },
        );
        tribeElders = tribeElders.slice(1, tribeElders.length);
      } else if (tribeMembers.length > 0) {
        await Tribe.findOneAndUpdate(
          { _id: tribe._id.toString() },
          { $set: { ownerId: tribeMembers[0].id } },
        );
        tribeMembers = tribeMembers.slice(1, tribeMembers.length);
      }
      const res = await Tribe.findOneAndUpdate(
        { _id: tribe._id.toString() },
        { $set: { "members.accepted": tribeCoowners.concat(tribeElders, tribeMembers) } },
      );
    }

    // ending recurring payments of members of deleted user's created memeberships

    const membershipObject = {};
    const createdMemberships = await Membership.find({ creatorId: user._id.toString() }).lean();
    const membershipIds = createdMemberships.map((membership) => membership._id.toString());
    createdMemberships.forEach((membership) => {
      membershipObject[membership._id.toString()] = membership.name;
    });

    const membersRecurringPayments = await RecurringPayment.find({
      "membership.currentId": { $in: membershipIds },
      "membership.currentExpiration": -1,
    }).lean();
    const membersArray = membersRecurringPayments.map((recurringPayment) => {
      return {
        userId: recurringPayment.userId,
        membershipId: recurringPayment.membership.currentId,
      };
    });

    const failed = [],
      failedIds = [];

    async function cancelMembership(recurringPayment) {
      const member = await User.find({ _id: recurringPayment.userId }).lean();
      const memberToken = member.token[0].token;

      let data;
      const apiResponse = await Utils.sendRequest({
        method: "POST",
        url: Config.paymentServiceBaseUrl + "/api/v2/recurring-payments/memberships/cancel",
        headers: {
          "access-token": memberToken,
          "content-type": "application/json",
        },
        body: { recurringPaymentId: recurringPayment._id.toString() },
      });

      const dataCopy = apiResponse;

      if (dataCopy?.code !== 1) {
        data = dataCopy;
      }

      if (data && data?.code !== 1) {
        failed.push({ userId: member._id.toString(), phoneNumber: member.phoneNumber });
        failedIds.push(member._id.toString());
      }
    }

    if (membersRecurringPayments.length > 0) {
      const promiseList = [];
      membersRecurringPayments.forEach((recurringPayment) => {
        promiseList.push(cancelMembership(recurringPayment));
      });

      await Promise.all(promiseList);
    }

    if (failed.length > 0) {
      logger.info(
        `DeleteUserController, cancel membership recurring payment for members - failed in these:`,
      );
      for (const member of failed)
        logger.info(`UserId: ${member.userId} | PhoneNumber: ${member.phoneNumber}`);
    }

    const addNotifPromiseList = [],
      increaseNotifPromiseList = [];

    for (const member of membersArray) {
      if (!failedIds.includes(member.userId)) {
        addNotifPromiseList.push(
          Notification.create({
            receiverIds: [member.userId],
            senderId: Config.flomSupportAgentId,
            notificationType: 11,
            title: `You have been removed from ${
              membershipObject[member.membershipId]
            } membership plan, owner deleted their account`,
            referenceId: member.membershipId,
            source: "flom_v1",
            created: Date.now(),
          }),
        );

        increaseNotifPromiseList.push(
          User.findByIdAndUpdate(member.userId, {
            $inc: { "notifications.unreadCount": 1 },
          }),
        );
      }
    }

    await Promise.all(addNotifPromiseList);
    await Promise.all(increaseNotifPromiseList);

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (e) {
    return Base.newErrorResponse({
      response,
      message: "DeleteUserController",
      error: e,
    });
  }
});

module.exports = router;
