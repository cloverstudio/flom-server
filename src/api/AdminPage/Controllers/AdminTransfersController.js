"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Transfer, Fulfillment } = require("#models");

/**
 * @api {get} /api/v2/admin-page/transactions Admin page transfer list
 * @apiVersion 2.0.8
 * @apiName Admin page transfer list
 * @apiGroup WebAPI Admin page
 * @apiDescription This API is called in order to get list of transfers. Moderator role needed for access.
 *
 * @apiParam (Query string) {String} transactionId Id of the transaction (transfer). If present ignores phoneNumber query
 * @apiParam (Query string) {String} phoneNumber Phone number of the sender or the receiver
 * @apiParam (Query string) {String} status Status of the transfer (from 1 to 6)
 * @apiParam (Query string) {String} transferType Type of the transfer (from 1 to 5)
 * @apiParam (Query string) {String} page Page number. Default 1
 * @apiParam (Query string) {String} itemsPerPage Number of results per page. Default 10
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1627653959326,
 *   "data": {
 *     "transactions": [
 *       {
 *         "id": "6103a50b2bf6fa0274d17848",
 *         "created": 1627628811545,
 *         "senderPhoneNumber": "+2348020000007",
 *         "receiverPhoneNumber": "+2348020000007",
 *         "transferType": 1,
 *         "status": 3,
 *         "amount": 5
 *       },
 *       {
 *         "id": "61014ab486bc6f313c4c121e",
 *         "created": 1627474612076,
 *         "receiverPhoneNumber": "+2348020000008",
 *         "transferType": 1,
 *         "status": 3,
 *         "amount": 20
 *       },
 *     ],
 *     "pagination": {
 *       "total": 1666,
 *       "itemsPerPage": 2
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
 * @apiError (Errors) 443093 Type parameter not valid
 * @apiError (Errors) 443148 TransactionId not valid
 * @apiError (Errors) 443105 Status parameter not valid
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/",
  auth({ allowAdmin: true, role: Const.Role.MODERATOR }),
  async (request, response) => {
    try {
      let phoneNumber = request.query.phoneNumber;
      const transferId = request.query.transactionId;
      const status = +request.query.status || null;
      const transferType = +request.query.transferType || null;
      const page = +request.query.page || 1;
      const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

      const searchQuery = {};

      if (transferId) {
        if (!Utils.isValidObjectId(transferId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTransferIdNotValid,
            message: `AdminTransferController - list, invalid transferId parameter`,
          });
        }
        searchQuery._id = transferId;
      } else if (phoneNumber) {
        phoneNumber = phoneNumber.replace(/\D/g, "");
        if (phoneNumber.startsWith(" ") || phoneNumber.startsWith("0")) {
          phoneNumber = "+" + phoneNumber.substring(1);
        }
        if (!phoneNumber.startsWith("+")) {
          phoneNumber = "+" + phoneNumber;
        }
        searchQuery["$or"] = [
          { senderPhoneNumber: phoneNumber },
          { receiverPhoneNumber: phoneNumber },
        ];
      }

      if (status !== null) {
        if (Const.transferStatuses.indexOf(status) === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTransferWrongStatus,
            message: `AdminTransferController - list, invalid status parameter`,
          });
        } else {
          searchQuery.status = status;
        }
      }

      if (transferType !== null) {
        if (Const.transferTypes.indexOf(transferType) === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTransferTypeNotFound,
            message: `AdminTransferController - list, invalid transferType parameter`,
          });
        } else {
          searchQuery.transferType = transferType;
        }
      }

      const transfers = await Transfer.find(searchQuery)
        .sort({ created: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean();

      const total = await Transfer.find(searchQuery).countDocuments();

      const transfersFormatted = transfers.map((transfer) => {
        return {
          id: transfer._id.toString(),
          created: transfer.created,
          senderPhoneNumber: transfer.senderPhoneNumber,
          receiverPhoneNumber: transfer.receiverPhoneNumber,
          transferType: transfer.transferType,
          status: transfer.status,
          amount: transfer.amount,
          creditsAmount: transfer.creditsAmount,
        };
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        transactions: transfersFormatted,
        pagination: {
          total,
          itemsPerPage,
        },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminTransferController - list",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/transactions/:transactionId Admin page get transfer
 * @apiVersion 2.0.8
 * @apiName Admin page get transfer
 * @apiGroup WebAPI Admin page
 * @apiDescription This API is called in order to get transfer by id. Moderator role needed for access.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1627653959326,
 *   "data": {
 *     "transaction": {
 *       "id": "6103a50b2bf6fa0274d17848",
 *       "created": 1627628811545,
 *       "gift": false,
 *       "testMode": false,
 *       "void": false,
 *       "promotion": {
 *           "amount": 2.50001,
 *           "type": 1,
 *           "id": "60f7e956b7922c6d740b6602",
 *           "value": 25
 *       },
 *       "senderType": "user",
 *       "receiverCountryCode": "NG",
 *       "receiverPhoneNumber": "+2348168888701",
 *       "receiverCarrier": "airtel",
 *       "senderPhoneNumber": "+2348020000020",
 *       "transferType": 1,
 *       "paymentMethodType": 1,
 *       "sku": "2",
 *       "amount": 10,
 *       "productName": "Top Up",
 *       "senderId": "6050d57ff69b9e15738a2bbb",
 *       "status": 3,
 *       "senderIP": "188.252.199.228",
 *       "senderUUID": "68414c196147673a",
 *       "receiptEmail": "luka.d@clover.studio",
 *       "processingFee": 0,
 *       "paymentProcessingInfo": {
 *           "code": "1",
 *           "message": "This transaction has been approved.",
 *           "referenceId": "40070240883"
 *       },
 *       "fulfillment": {
 *         "_id" : ObjectId("610164a2fa25e4c157a317dc"),
 *         "created" : 1627481250343,
 *         "unknownReceiptRetryCount" : 0,
 *         "gift" : false,
 *         "transferId" : "6101648cfa25e4c157a317da",
 *         "receiverPhoneNumber" : "+2348098787291",
 *         "operationId" : "968924665810072600",
 *         "APIRequest" : {
 *         	"data" : {
 *         		"operationId" : "968924665810072600",
 *         		"acquirerMsisdn" : "+2348098787291",
 *         		"amount" : 2360
 *         	},
 *         	"url" : "https://host.qrios.pw/v1/airtime/recharge"
 *         },
 *         "APIResponse" : {
 *         	"statusCode" : 202,
 *         	"body" : "The request has been accepted for processing, but the processing has not been completed."
 *         },
 *         "amount" : 5,
 *         "senderId" : "601024e11f02dea7f3d89f60",
 *         "callbackAPIResponse" : {
 *         	"clientId" : "vdpzDLPB",
 *         	"operationId" : "968924665810072600",
 *         	"operation" : "acquire",
 *         	"result" : "success",
 *         	"cause" : null,
 *         	"status" : {
 *         		"result" : "success",
 *         		"cause" : null
 *         	},
 *         	"acquire" : {
 *         		"operator" : null,
 *         		"reference" : "158725494",
 *         		"transactionId" : "2021072815073031106399122",
 *         		"error" : null
 *         	}
 *         },
 *         "status" : "success"
 *       }
 *     },
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400165 Transaction not found
 * @apiError (Errors) 443148 TransactionId not valid
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/:transactionId",
  auth({ allowAdmin: true, role: Const.Role.MODERATOR }),
  async (request, response) => {
    try {
      const transferId = request.params.transactionId;

      if (transferId) {
        if (!Utils.isValidObjectId(transferId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTransferIdNotValid,
            message: `AdminTransferController - get transfer, invalid transferId parameter`,
          });
        }
      }

      const transfer = await Transfer.findOne({ _id: transferId }).lean();

      if (!transfer) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTransactionNotFound,
          message: `AdminTransferController - get transfer, transfer not found`,
        });
      }
      const { _id: id, __v: transfer_v, ...transferData } = transfer;

      const responseData = { id: id.toString(), ...transferData };

      const fulfillment = await Fulfillment.findOne({ transferId }).lean();
      if (fulfillment) {
        const { _id: fulfillmentId, __v: fulfillment_v, ...fulfillmentData } = fulfillment;
        responseData.fulfillment = { id: fulfillmentId.toString(), ...fulfillmentData };
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        transaction: responseData,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminTransferController - get transfer",
        error,
      });
    }
  },
);

module.exports = router;
