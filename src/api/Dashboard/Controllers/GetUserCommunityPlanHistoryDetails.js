"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, RecurringPayment, Membership } = require("#models");

/**
 * @api {get} /api/v2/dashboard/community/user-payments Dashboard - Get user history of community payments API
 * @apiVersion 0.0.1
 * @apiName Dashboard - Get user history of community payments API
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to fetch the list of user previous community payments.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} userId Id of user whose history of payments will be returned.
 * @apiParam (Query string) {Number} membershipIds Array of membershipIds. For example  ( ?membershipIds[]=621cdfdad6db386b68a8d548&membershipIds[]=625e9afaca33ed174fcd5170 )
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1677755449828,
 *     "data": {
 *         "userHistoryPayments": [
 *             {
 *                 "_id": "63f8ca8a655ad96fd8124edd",
 *                 "transfers": [
 *                     {
 *                         "id": "63f8ca89655ad96fd8124edc",
 *                         "void": false,
 *                         "source": "flom_v1",
 *                         "senderId": "63e244b294deb3742b01410f",
 *                         "senderCountryCode": "US",
 *                         "receiverCountryCode": "US",
 *                         "senderPhoneNumber": "+17708002222",
 *                         "receiverId": "63dd00f8c30542684f1b7bc0",
 *                         "receiverPhoneNumber": "+17708001111",
 *                         "transferType": 5,
 *                         "productName": "Membership upfront charge",
 *                         "paymentMethodType": 1,
 *                         "amount": 14.28571,
 *                         "localAmountSender": {
 *                             "countryCode": "US",
 *                             "currency": "USD",
 *                             "value": 14.29
 *                         },
 *                         "localAmountReceiver": {
 *                             "countryCode": "US",
 *                             "currency": "USD",
 *                             "value": 14.29
 *                         },
 *                         "processingFee": 0,
 *                         "status": 3,
 *                         "senderIP": "94.253.161.219",
 *                         "created": 1677249161338,
 *                         "gift": false,
 *                         "testMode": false,
 *                         "promotion": {
 *                             "amount": 0
 *                         },
 *                         "multi": false,
 *                         "isNigerianAPI": false,
 *                         "eligibleForPayout": true,
 *                         "payoutCompleted": false,
 *                         "paymentProcessingInfo": {
 *                             "code": "1",
 *                             "message": "This transaction has been approved.",
 *                             "referenceId": "60210206117"
 *                         },
 *                         "membershipId": "63f8ca38017f5378dcc2fbb5",
 *                         "membershipPaymentType": 1,
 *                         "__v": 0
 *                     }
 *                 ],
 *                 "membership": {
 *                     "currentId": "63f8ca38017f5378dcc2fbb5"
 *                 }
 *             }
 *         ],
 *         "total": 1,
 *         "countResult": 1,
 *         "hasNext": false
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    var membershipIds = request.query.membershipIds || [];
    var userId = request.query.userId;
    const page = +request.query.page || 1;

    if (!userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUserId,
        message: "GetUserCommunityPlanHistoryDetails, no userId parameter",
      });
    }

    const userFromMembership = await User.find({ _id: userId }).lean();

    if (!userFromMembership) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserIdNotValid,
        message: "GetUserCommunityPlanHistoryDetails, invalid userId parameter",
      });
    }

    const memberships = await Membership.find({ _id: { $in: membershipIds } }).lean();

    if (memberships.length !== membershipIds.length) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMembershipNotFound,
        message: "GetUserCommunityPlanHistoryDetails, invalid membershipIds parameter",
      });
    }

    const userHistoryPayments = await RecurringPayment.find(
      {
        userId: userId,
        "membership.currentId": { $in: membershipIds },
      },
      { transfers: 1, "membership.currentId": 1 },
    )
      .skip((page - 1) * Const.newPagingRows)
      .limit(Const.newPagingRows)
      .lean();

    const total = await RecurringPayment.find({
      userId: userId,
      "membership.currentId": { $in: membershipIds },
    }).countDocuments();
    const hasNext = page * Const.newPagingRows < total;

    Base.successResponse(response, Const.responsecodeSucceed, {
      userHistoryPayments,
      total,
      countResult: userHistoryPayments.length,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetUserCommunityPlanHistoryDetails",
      error,
    });
  }
});

module.exports = router;
