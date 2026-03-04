"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Payout, User, Transfer } = require("#models");

/**
 * @api {get} /api/v2/admin-page/payout Admin page get payout list flom_v1
 * @apiVersion 2.0.10
 * @apiName Admin page get payout list flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription API for fetching list of payouts.
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} status        Status of payout
 * @apiParam (Query string) {String} payoutId      Id of payout
 * @apiParam (Query string) {String} phoneNumber   Payout receiver's phone number
 * @apiParam (Query string) {String} userName      Payout receiver's username
 * @apiParam (Query string) {String} page          Page
 * @apiParam (Query string) {String} itemsPerPage  Number of items to fetch per page
 *
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1672410506938,
 *     "data": {
 *         "payoutList": [
 *             {
 *                 "payoutId": "63a300cd3ea98b281114df83",
 *                 "userId": "60a654f17996ed34687d3b23",
 *                 "userName": "toyobabyi",
 *                 "phoneNumber": "+2348130717898",
 *                 "bankAccount": {
 *                     "number": "311****710",
 *                     "code": "011",
 *                     "name": "FBN"
 *                 },
 *                 "cashAmount": 10,
 *                 "creditsAmount": 0,
 *                 "creditsAmountInUSD": 0,
 *                 "amount": 10,
 *                 "status": 1,
 *                 "created": 1671626957640,
 *                 "modifiedList": [
 *                   {
 *                     "created": 0,
 *                     "adminId": "abcd",
 *                     "adminUsername": "lorem",
 *                     "oldStatus": 1,
 *                     "newStatus": 2
 *                   }
 *                 ]
 *             },
 *             {
 *                 "payoutId": "631f2b9fa932b524d04301cb",
 *                 "userId": "5f7ee464a283bc433d9d722f",
 *                 "userName": "mdragic",
 *                 "phoneNumber": "+2348020000007",
 *                 "paypalEmail": "ivo.peric@flom.com",
 *                 "cashAmount": 30,
 *                 "creditsAmount": 0,
 *                 "creditsAmountInUSD": 0,
 *                 "amount": 30,
 *                 "status": 3,
 *                 "created": 1662987167225
 *                 "modifiedList": [
 *                   {
 *                     "created": 0,
 *                     "adminId": "abcd",
 *                     "adminUsername": "lorem",
 *                     "oldStatus": 1,
 *                     "newStatus": 2
 *                   }
 *                 ]
 *             },
 *         ],
 *         "pagination": {
 *             "page": 3,
 *             "itemsPerPage": 2,
 *             "total": 39,
 *             "hasNext": true
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443636 Invalid status parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const {
        status: tempStatus,
        payoutId,
        phoneNumber,
        userName,
        page: tempPage,
        itemsPerPage: tempItemsPerPage,
      } = request.query;
      const status = !tempStatus ? null : +tempStatus;
      const page = !tempPage ? 1 : +tempPage;
      const itemsPerPage = !tempItemsPerPage ? Const.newPagingRows : +tempItemsPerPage;

      const query = {};
      if (status) {
        if (Const.payoutStatuses.indexOf(status) === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidStatusParameter,
            message: `AdminPayoutController, GET List - invalid status parameter`,
          });
        }

        query.status = status;
      }
      if (payoutId) query._id = payoutId;
      if (phoneNumber) query.receiverPhoneNumber = phoneNumber;
      if (userName) query.receiverUserName = userName;

      const total = await Payout.countDocuments(query);

      const pagination = {
        page,
        itemsPerPage,
        total,
        hasNext: total > page * itemsPerPage,
      };

      const payoutList = await Payout.find(query)
        .sort({ created: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean();

      const formattedPayoutList = payoutList.map((payout) => {
        const accountNumber = payout.receiverBankAccount?.bankAccountNumber;
        const maskedAccountNumber = !accountNumber
          ? ""
          : accountNumber.slice(0, 3) + "****" + accountNumber.slice(-3);
        const bankCode = payout.receiverBankAccount?.bankCode;

        const bankAccount = !payout.receiverBankAccount
          ? undefined
          : {
              number: maskedAccountNumber,
              code: bankCode ?? "",
              name: payout.receiverBankAccount?.bankName ?? Const.banksByCode[bankCode] ?? "",
            };

        const payoutData = {
          payoutId: payout._id.toString(),
          userId: payout.receiverId,
          userName: payout.receiverUserName,
          phoneNumber: payout.receiverPhoneNumber,
          paypalEmail: payout.receiverPaypalEmail,
          bankAccount,
          cashAmount: payout.cashAmount,
          creditsAmount: payout.creditsAmount,
          creditsAmountInUSD: payout.creditsAmountInUSD,
          bonusAmount: payout.bonusAmount,
          totalAmount: payout.totalAmount,
          status: payout.status,
          created: payout.created,
          modifiedList: payout.modifiedList ?? [],
        };

        return payoutData;
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        payoutList: formattedPayoutList,
        pagination,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminPayoutController, GET List",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/payout/:payoutId Admin page get payout flom_v1
 * @apiVersion 2.0.10
 * @apiName Admin page get payout flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription API for fetching a payout.
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1672410506938,
 *     "data": {
 *         "payout": {
 *                 "payoutId": "63a300cd3ea98b281114df83",
 *                 "userId": "60a654f17996ed34687d3b23",
 *                 "userName": "toyobabyi",
 *                 "phoneNumber": "+2348130717898",
 *                 "bankAccount": {
 *                     "number": "311****710",
 *                     "code": "011",
 *                     "name": "FBN"
 *                 },
 *                 "cashAmount": 10,
 *                 "creditsAmount": 0,
 *                 "creditsAmountInUSD": 0,
 *                 "amount": 10,
 *                 "status": 1,
 *                 "created": 1671626957640,
 *                 "modifiedList": [
 *                   {
 *                     "created": 0,
 *                     "adminId": "abcd",
 *                     "adminUserName": "lorem",
 *                     "oldStatus": 1,
 *                     "newStatus": 2
 *                   }
 *                 ]
 *          }
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

router.get(
  "/:payoutId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const payoutId = request.params.payoutId;

      const payout = await Payout.findById(payoutId).lean();

      const accountNumber = payout.receiverBankAccount?.bankAccountNumber;
      const maskedAccountNumber = !accountNumber
        ? ""
        : accountNumber.slice(0, 3) + "****" + accountNumber.slice(-3);
      const bankCode = payout.receiverBankAccount?.bankCode;

      const bankAccount = !payout.receiverBankAccount
        ? undefined
        : {
            number: maskedAccountNumber,
            code: bankCode ?? "",
            name: payout.receiverBankAccount?.bankName ?? Const.banksByCode[bankCode] ?? "",
          };

      const payoutData = {
        payoutId: payout._id.toString(),
        userId: payout.receiverId,
        userName: payout.receiverUserName,
        phoneNumber: payout.receiverPhoneNumber,
        paypalEmail: payout.receiverPaypalEmail,
        bankAccount,
        cashAmount: payout.cashAmount,
        creditsAmount: payout.creditsAmount,
        creditsAmountInUSD: payout.creditsAmountInUSD,
        bonusAmount: payout.bonusAmount,
        totalAmount: payout.totalAmount,
        status: payout.status,
        created: payout.created,
        modifiedList: payout.modifiedList ?? [],
      };

      Base.successResponse(response, Const.responsecodeSucceed, { payout: payoutData });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminPayoutController, GET",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/admin-page/payout/:payoutId Admin page update payout status flom_v1
 * @apiVersion 2.0.10
 * @apiName Admin page update payout status flom_v1
 * @apiGroup WebAPI Admin page - Payouts
 * @apiDescription API for updating payout status.
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam {String} status New status of payout
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1672414776567,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443636 Invalid status parameter
 * @apiError (Errors) 443343 Payout not found
 * @apiError (Errors) 443344 New status same as old status
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/:payoutId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const payoutId = request.params.payoutId;
      const status = request.body.status;

      if (Const.payoutStatuses.indexOf(status) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidStatusParameter,
          message: `AdminPayoutController, PATCH - invalid status parameter`,
        });
      }

      const payout = await Payout.findById(payoutId).lean();

      if (!payout) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodePayoutNotFound,
          message: `AdminPayoutController, PATCH - payout not found`,
        });
      }

      if (status === payout.status) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNewStatusSameAsOldStatus,
          message: `AdminPayoutController, PATCH - new status is is same as old status`,
        });
      }

      const admin = request.user;

      const modifiedData = {
        created: Date.now(),
        adminId: admin._id.toString(),
        adminUserName: admin.username,
        oldStatus: payout.status,
        newStatus: status,
      };

      await Payout.findByIdAndUpdate(payoutId, {
        $set: { status },
        $push: { modifiedList: modifiedData },
      });

      if (status === Const.payoutFailed) {
        if (payout.creditsAmount && payout.creditsAmount > 0) {
          await User.updateOne(
            { _id: payout.receiverId },
            { $inc: { creditBalance: payout.creditsAmount } },
          );
        }

        if (payout.satsAmount && payout.satsAmount > 0) {
          await User.updateOne(
            { _id: payout.receiverId },
            { $inc: { satsBalance: payout.satsAmount } },
          );
        }

        if (payout.transferIds.length > 0) {
          await Transfer.updateMany(
            { _id: { $in: payout.transferIds } },
            { payoutCompleted: false, eligibleforPayout: true },
          );
        }
      }

      Base.successResponse(response, Const.responsecodeSucceed);

      try {
        if (status === Const.payoutComplete || status === Const.payoutFailed) {
          let message, pushType;

          const receiver = await User.findById(payout.receiverId).lean();

          const promiseList = [];

          if (status === Const.payoutComplete) {
            message = "Payout completed";
            pushType = Const.pushTypePayoutComplete;
          }
          if (status === Const.payoutFailed) {
            message = "Payout failed";
            pushType = Const.pushTypePayoutFailed;
          }

          receiver.pushToken.forEach((token) => {
            const info = {
              payoutId: payout._id.toString(),
              receiverId: payout.receiverId,
              receiverPhoneNumber: payout.receiverPhoneNumber,
              status,
              message,
            };
            const pushData = {
              pushToken: token,
              isVoip: false,
              unreadCount: 1,
              isMuted: false,
              payload: {
                pushType,
                info,
              },
            };

            promiseList.push(Utils.callPushService(pushData));
          });

          await Promise.all(promiseList);
        }
      } catch (error) {
        console.log(`AdminPayoutController, PATCH - ${JSON.stringify(error)}`);
      }
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminPayoutController, PATCH",
        error,
      });
    }
  },
);

module.exports = router;
