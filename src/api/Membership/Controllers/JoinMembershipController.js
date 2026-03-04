"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Notification, Membership, RecurringPayment, User } = require("#models");

/**
 * @api {post} /api/v2/memberships/join/:membershipId Join a membership
 * @apiVersion 2.0.10
 * @apiName Join a membership
 * @apiGroup WebAPI Membership
 * @apiDescription API used for joining a membership plan from a creator. IMPORTANT! Initiate membership recurring payment API needs to be called first.
 * If there is no active recurring payment then this API will throw an error. If you canceled membership and then you rejoin in the same month another
 * membership with lower value then you will keep the benefits of the higher one till the end of the month.
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
 *     "title": "New member in VIP plan",
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
 * @apiError (Errors) 443243 User already a member of this membership plan
 * @apiError (Errors) 443245 User already a member of a different membership from same creator
 * @apiError (Errors) 443246 No active recurring payment for this membership plan. Initiate membership recurring payment API needs to be called first
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
        message: `JoinMembershipController, invalid membershipId`,
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
        message: `JoinMembershipController, membership with ${membershipId} not found`,
      });
    }

    const creatorId = membership.creatorId;

    const userMemberships = Utils.filterExpiredMemberships(user.memberships);
    if (userMemberships.length !== user.memberships.length) {
      user.memberships = userMemberships;
      await User.findByIdAndUpdate(user._id.toString(), { memberships: userMemberships });
    }

    const index = userMemberships.findIndex((membership) => membership.id === membershipId);
    const alreadyMember = userMemberships[index];
    if (alreadyMember?.expirationDate === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserAlreadyMember,
        message: `JoinMembershipController, user already a members of the membership`,
      });
    }

    const creatorsOtherMemberships = await Membership.find(
      { _id: { $ne: membershipId }, creatorId: membership.creatorId, deleted: false },
      { _id: 1 },
    ).lean();
    const creatorsOtherMembershipsIds = creatorsOtherMemberships.map((membership) =>
      membership._id.toString(),
    );

    const memberOfAnotherMembership = userMemberships.filter(
      (membership) => creatorsOtherMembershipsIds.indexOf(membership.id) !== -1,
    );

    if (
      memberOfAnotherMembership.length > 0 &&
      memberOfAnotherMembership[0].expirationDate === -1 &&
      memberOfAnotherMembership[0].startDate < Date.now()
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserAlreadyCreatorsMember,
        message: `JoinMembershipController, user already a members of the creators membership`,
      });
    }

    const recurringPayment = await RecurringPayment.findOne({
      type: membership.recurringPaymentType,
      status: Const.recurringPaymentStatusActive,
      userId: requestUserId,
      $or: [{ "membership.currentId": membershipId }, { "membership.newId": membershipId }],
    }).lean();

    if (!recurringPayment) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoActiveRecurringPayment,
        message: `JoinMembershipController, no active recurring payment`,
      });
    }

    if (alreadyMember) {
      userMemberships[index].expirationDate = -1;
    } else if (memberOfAnotherMembership.length > 0) {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), (today.getMonth() + 1) % 12, 1, 1).getTime();
      userMemberships.push({ id: membershipId, creatorId, expirationDate: -1, startDate });
    } else {
      userMemberships.push({ id: membershipId, creatorId, expirationDate: -1, startDate: -1 });
    }

    const title = `New member in ${membership.name}`;
    await Notification.create({
      title,
      referenceId: membershipId,
      receiverIds: [creatorId],
      senderId: requestUserId,
      notificationType: Const.notificationTypeMemberships,
    });

    await User.updateOne(
      { phoneNumber: user.phoneNumber },
      { $set: { memberships: userMemberships }, $inc: { "notifications.unreadCount": 1 } },
    );

    await Utils.sendPushNotifications({
      pushTokens: user.pushToken,
      pushType: Const.pushTypeMembership,
      info: {
        title,
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
      message: "JoinMembershipController",
      error,
    });
  }
});

module.exports = router;
