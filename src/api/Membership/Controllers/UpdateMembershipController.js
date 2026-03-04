"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Notification, Membership, RecurringPayment, User } = require("#models");

/**
 * @api {post} /api/v2/memberships/update/:newMembershipId Update to a membership
 * @apiVersion 2.0.8
 * @apiName Update to a membership
 * @apiGroup WebAPI Membership
 * @apiDescription API used for updating to a different membership plan of the same creator. When upgrading you are only charged the difference between the
 * prices of the memberships. If you downgrade membership then you will keep the higher membership until the end of the current month.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} cardNumber          Credit card number (13-16 digit number)
 * @apiParam {String} expirationDate      Expiration date of the credit card. Has to be 4 numbers in format MMYY
 * @apiParam {String} cardCode            The 3 or 4 digit card code
 * @apiParam {String} address             Address of the user of the credit card
 * @apiParam {String} zip                 Zip code of the address for the credit card
 * @apiParam {String} firstName           Users first name (should be same as on credit card used)
 * @apiParam {String} lastName            Users last name (should be same as on credit card used)
 * @apiParam {String} receiptEmail        Email for sending the receipt
 * @apiParam {Number} paymentMethodType   Type of payment method (1 - credit card, 2 - PayPal). Currently only credit card is supported
 * @apiParam {String} [paymentMethodId]   Authorize.net customer payment profile id. Used for paying with users saved payment method
 * @apiParam {String} [countryCode]       Country code of the credit card
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1631704703703,
 *   "data": {
 *     "complete": true,
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443076 No paymentMethodType parameter
 * @apiError (Errors) 443078 Payment method not allowed
 * @apiError (Errors) 443079 Active recurring payment for this membership already exists
 * @apiError (Errors) 443082 No cardNumber parameter in the request
 * @apiError (Errors) 443083 cardNumber incorrect length
 * @apiError (Errors) 443084 cardNumber is incorrect
 * @apiError (Errors) 443085 No expirationDate parameter in the request
 * @apiError (Errors) 443086 expirationDate incorrect length
 * @apiError (Errors) 443087 expirationDate is incorrect
 * @apiError (Errors) 443088 No cardCode parameter in the request
 * @apiError (Errors) 443089 cardCode incorrect length
 * @apiError (Errors) 443090 cardCode is incorrect
 * @apiError (Errors) 443091 paymentMethod not found
 * @apiError (Errors) 443102 No address parameter
 * @apiError (Errors) 443103 No zip parameter
 * @apiError (Errors) 443123 Credit card country and phonenumber country do not match
 * @apiError (Errors) 443134 Not allowed. Request IP is banned
 * @apiError (Errors) 443147 No receiptEmail
 * @apiError (Errors) 443240 Invalid newMembershipId
 * @apiError (Errors) 443241 Membership with newMembershipId is not found
 * @apiError (Errors) 443243 User already a member of this membership plan
 * @apiError (Errors) 443244 User is not a member of this membership plan
 * @apiError (Errors) 443246 No active recurring payment
 * @apiError (Errors) 443247 User not a member of a membership plan from the same creator. Or new membership plan costs less than old one.
 * @apiError (Errors) 443440 Invalid source parameter. Only accepts "flom_v1" or "flom"
 * @apiError (Errors) 443480 VPN
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/:newMembershipId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { newMembershipId } = request.params;
    const {
      cardNumber,
      expirationDate,
      cardCode,
      address,
      zip,
      firstName,
      lastName,
      receiptEmail,
      paymentMethodType,
      paymentMethodId,
      countryCode,
    } = request.body;
    const userIP = request.headers["x-forwarded-for"] || request.socket.remoteAddress;

    if (!Utils.isValidObjectId(newMembershipId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidMembershipId,
        message: `UpdateMembershipController, invalid newMembershipId`,
      });
    }

    const newMembership = await Membership.findOne({ _id: newMembershipId }).lean();
    if (!newMembership) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMembershipNotFound,
        message: `UpdateMembershipController, membership with ${newMembershipId} not found`,
      });
    }

    let userMemberships = Utils.filterExpiredMemberships(user.memberships);
    if (userMemberships.length !== user.memberships.length) {
      user.memberships = userMemberships;
      await User.findByIdAndUpdate(user._id.toString(), { memberships: userMemberships });
    }

    const activeNewMembership = userMemberships.find(
      (membership) => membership.id === newMembershipId,
    );
    if (activeNewMembership && activeNewMembership.expirationDate === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserAlreadyMember,
        message: `UpdateMembershipController, user already a member of the membership with ${newMembershipId} id`,
      });
    }

    const userMembershipIds = userMemberships.map((membership) => membership.id);
    const sameCreatorMemberships = await Membership.find({
      _id: { $in: userMembershipIds },
      creatorId: newMembership.creatorId,
      deleted: false,
    }).lean();

    if (sameCreatorMemberships.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidMembershipToUpgradeTo,
        message: `UpdateMembershipController, invalid membership to update to`,
      });
    }

    let oldMembership;
    if (sameCreatorMemberships.length === 1) {
      oldMembership = sameCreatorMemberships[0];
    } else {
      const sameCreatorMembershipIds = sameCreatorMemberships.map((membership) =>
        membership._id.toString(),
      );

      const oldMembershipFromUser = userMemberships.find(
        (membership) =>
          sameCreatorMembershipIds.indexOf(membership.id) !== -1 &&
          membership.expirationDate === -1,
      );
      oldMembership = sameCreatorMemberships.find(
        (membership) => membership._id.toString() === oldMembershipFromUser.id,
      );

      userMemberships = userMemberships.filter(
        (membership) => membership.id !== oldMembership._id.toString(),
      );
    }

    const oldMembershipId = oldMembership._id.toString();

    let recurringPayment = await RecurringPayment.findOne({
      type: oldMembership.recurringPaymentType,
      status: Const.recurringPaymentStatusActive,
      userId: user._id.toString(),
      $or: [{ "membership.currentId": oldMembershipId }, { "membership.newId": oldMembershipId }],
    }).lean();
    if (!recurringPayment) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoActiveRecurringPayment,
        message: `UpdateMembershipController, no active recurring payment`,
      });
    }

    try {
      const apiResponse = await Utils.sendRequest({
        method: "POST",
        url: Config.paymentServiceBaseUrl + "/api/v2/payment/recurring/update",
        headers: {
          "access-token": request.headers["access-token"],
          "content-type": "application/json",
        },
        body: JSON.stringify({
          oldMembershipId,
          newMembershipId,
          cardNumber,
          expirationDate,
          cardCode,
          address,
          zip,
          firstName,
          lastName,
          receiptEmail,
          paymentMethodType,
          paymentMethodId,
          countryCode,
          userIP,
        }),
      });
      const data = apiResponse;
      if (data?.code !== 1) {
        return Base.newErrorResponse({
          response,
          code: data.code,
          message:
            data.message || `UpdateMembershipController, update membership recurring payment`,
        });
      }
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeCallPaymentServiceError,
        message: "UpdateMembershipController, call payment service API",
        error,
      });
    }

    let updatedUserMemberships = [];
    const creatorId = newMembership.creatorId;
    if (oldMembership.amount < newMembership.amount) {
      updatedUserMemberships = userMemberships.filter(
        (membership) => membership.id !== oldMembershipId && membership.id !== newMembershipId,
      );

      updatedUserMemberships.push({
        id: newMembershipId,
        creatorId,
        expirationDate: -1,
        startDate: -1,
      });
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1) % 12;
      const expirationDate = new Date(year, month, 0, 23).getTime();
      const startDate = new Date(year, month, 1, 1).getTime();

      let newMembershipUpdated = false;
      for (let i = 0; i < userMemberships.length; i++) {
        const membership = userMemberships[i];
        if (membership.id === oldMembershipId) {
          membership.expirationDate = expirationDate;
        } else if (membership.id === newMembershipId) {
          membership.expirationDate = -1;
          membership.startDate = startDate;
          newMembershipUpdated = true;
        }
        updatedUserMemberships.push(membership);
      }

      if (!newMembershipUpdated) {
        updatedUserMemberships.push({
          id: newMembershipId,
          creatorId,
          expirationDate: -1,
          startDate,
        });
      }
    }

    const title = `Member updated to ${newMembership.name}`;
    await Notification.create({
      title,
      referenceId: newMembership._id.toString(),
      receiverIds: [creatorId],
      senderId: user._id.toString(),
      notificationType: Const.notificationTypeMemberships,
    });

    await User.updateOne(
      { phoneNumber: user.phoneNumber },
      { $set: { memberships: updatedUserMemberships } },
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      completed: true,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UpdateMembershipController",
      error,
    });
  }
});

module.exports = router;
