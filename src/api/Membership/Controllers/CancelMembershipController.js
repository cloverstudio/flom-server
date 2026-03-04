"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Notification, Membership, RecurringPayment, User } = require("#models");

/**
 * @api {post} /api/v2/memberships/cancel/:membershipId Cancel a membership
 * @apiVersion 2.0.8
 * @apiName Cancel a membership
 * @apiGroup WebAPI Membership
 * @apiDescription API used for canceling (leaving) a membership plan. User will keep membership benefits until the end of the month.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631704703703,
 *   "data": {
 *     "complete": true,
 *   }
 * }
 *
 * @apiSuccessExample {json} Push notification (to membership creator)
 * {
 *   "pushType": 785,
 *   "info": {
 *     "title": "Member canceled VIP plan",
 *     "membershipId": "61823caa33b1083a21fc68f0",
 *     "from": {
 *       "id": "61823caa33b1083a21fc68f0",
 *       "name": "Name",
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
 * @apiError (Errors) 443240 Invalid membershipId
 * @apiError (Errors) 443241 Membership with membershipId is not found
 * @apiError (Errors) 443244 User is not a member of this membership plan
 * @apiError (Errors) 443246 No active recurring payment
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/:membershipId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const requestUserId = user._id.toString();
    const { membershipId } = request.params;

    if (!Utils.isValidObjectId(membershipId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidMembershipId,
        message: `CancelMembershipController, invalid membershipId`,
      });
    }

    const membership = await Membership.findOne(
      { _id: membershipId },
      { _id: 1, name: 1, creatorId: 1, recurringPaymentType: 1 },
    ).lean();
    if (!membership) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMembershipNotFound,
        message: `CancelMembershipController, membership with ${membershipId} not found`,
      });
    }

    const userMemberships = Utils.filterExpiredMemberships(user.memberships);
    if (userMemberships.length !== user.memberships.length) {
      user.memberships = userMemberships;
      await User.findByIdAndUpdate(user._id.toString(), { memberships: userMemberships });
    }

    const index = userMemberships.findIndex(
      (membership) => membership.id === membershipId && membership.expirationDate === -1,
    );
    if (index === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotMember,
        message: `CancelMembershipController, user not member of the membership with ${membershipId} id`,
      });
    }

    let recurringPayment = await RecurringPayment.findOne({
      type: membership.recurringPaymentType,
      status: Const.recurringPaymentStatusActive,
      userId: requestUserId,
      $or: [{ "membership.currentId": membershipId }, { "membership.newId": membershipId }],
    }).lean();
    if (!recurringPayment) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoActiveRecurringPayment,
        message: `CancelMembershipController, no active recurring payment`,
      });
    }

    try {
      const apiResponse = await Utils.sendRequest({
        method: "POST",
        url: Config.paymentServiceBaseUrl + "/api/v2/payment/recurring/cancel",
        headers: {
          "access-token": request.headers["access-token"],
          "content-type": "application/json",
        },
        body: JSON.stringify({ recurringPaymentId: recurringPayment._id.toString() }),
      });
      const data = apiResponse;
      if (data?.code !== 1) {
        return Base.newErrorResponse({
          response,
          code: data.code,
          message:
            data.message || `CancelMembershipController, cancel membership recurring payment`,
        });
      }
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeCallPaymentServiceError,
        message: "CancelMembershipController, call payment service API",
        error,
      });
    }

    recurringPayment = await RecurringPayment.findOne(
      { _id: recurringPayment._id },
      { membership: 1 },
    ).lean();

    let updatedUserMemberships = userMemberships;
    if (updatedUserMemberships[index].startDate < Date.now()) {
      updatedUserMemberships[index].expirationDate = recurringPayment.membership.currentExpiration;
    } else {
      updatedUserMemberships = userMemberships.filter(
        (membership) => membership.id !== membershipId,
      );
    }

    const title = `Member canceled ${membership.name}`;
    await Notification.create({
      title,
      referenceId: membershipId,
      receiverIds: [membership.creatorId],
      senderId: requestUserId,
      notificationType: Const.notificationTypeMemberships,
    });

    await User.updateOne(
      { phoneNumber: user.phoneNumber },
      {
        $set: { memberships: updatedUserMemberships },
        $inc: { "notifications.unreadCount": 1 },
      },
    );

    await Utils.sendPushNotifications({
      pushTokens: user.pushToken,
      pushType: Const.pushTypeMembership,
      info: {
        membershipId,
        from: { id: requestUserId, name: user.name, phoneNumber: user.phoneNumber },
      },
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      completed: true,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CancelMembershipController",
      error,
    });
  }
});

module.exports = router;
