"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Transfer } = require("#models");

/**
 * @api {get} /api/v2/users/transfers Contact transfer list flom_v1
 * @apiVersion 2.0.5
 * @apiName  Contact transfer list flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  API which is called to get the list of all transfers between user and the given phone numbers.
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} phoneNumber Phone numbers of the contacts for which to return the list of mutual transfers. If there is more
 * than one phone number query should look like this "?phoneNumber=38597774088&phoneNumber=385952215886". This parameter is required
 * @apiParam (Query string) {String} [page] Page number. Default 1
 * @apiParam (Query string) {String} [itemsPerPage] Number of results per page. Default 10
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "transfers": [
 *       {
 *         "transferId": "5fb3a7b034d6f365d5d68fea",
 *         "date": 1605609392737,
 *         "status": 3, // 1 - UserTransfers, 2 - Waiting for fulfillment, 3 - Completed, 4 - Failed
 *         "description": {
 *           "action": "Received", //, Received (status = 3)
 *           "product": "$50 Top Up"
 *         },
 *         "from": "+2348020000011",
 *         "contactUsername": "flom13",
 *         "information": "Transaction has been charged. Waiting for fulfillment." //this field is only present if status is 2 or 4
 *         "avatar": "https://dev.flom.app/api/v2/avatar/user/thumb-ekmW1eQMBcEYzw54ImTcRc4zgD" //link to avatar of the other participant, will not be set if non flom user
 *       },
 *       {
 *         "transferId": "5fb3a7b034d6f365d5d68fea",
 *         "date": 1605609392737,
 *         "status": 3, // 1 - UserTransfers, 2 - Waiting for fulfillment, 3 - Completed, 4 - Failed
 *         "description": {
 *           "action": "Sent", // Sent (status = 3),  Pending (2), Failed (4)
 *           "product": "3.75GB 30days"
 *         },
 *         "to": "+2348020000013",
 *         "contactUsername": "flom15",
 *         "information": "Transaction has been charged. Waiting for fulfillment." //this field is only present if status is 2 or 4
 *         "avatar": "https://dev.flom.app/api/v2/avatar/user/thumb-ekmW1eQMBcEYzw54ImTcRc4zgD" //link to avatar of the other participant, will not be set if non flom user
 *       }
 *     ],
 *     "total": 72,
 *     "hasNext": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400180 No phoneNumber query parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const requestUserId = request.user._id.toString();
    const requestUserPhoneNumber = request.user.phoneNumber;
    let otherPartyPhoneNumbers = request.query.phoneNumber;
    const page = +request.query.page || 1;
    const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

    if (!otherPartyPhoneNumbers) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPhoneNumber,
        message: "UserTransfers, no phoneNumber query",
      });
    }

    if (typeof otherPartyPhoneNumbers === "string") {
      otherPartyPhoneNumbers = [otherPartyPhoneNumbers];
    }

    const countryCode =
      request.user.countryCode ||
      Utils.getCountryCodeFromPhoneNumber({
        phoneNumber: requestUserPhoneNumber,
      });
    const formattedOtherPartyPhoneNumbers = [];
    for (let i = 0; i < otherPartyPhoneNumbers.length; i++) {
      const phoneNumber = Utils.formatPhoneNumber({
        phoneNumber: otherPartyPhoneNumbers[i],
        countryCode,
      });
      if (phoneNumber) {
        formattedOtherPartyPhoneNumbers.push(phoneNumber);
      }
    }

    if (formattedOtherPartyPhoneNumbers.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPhoneNumber,
        message: "UserTransfers, no phoneNumbers after formatting",
      });
    }

    const otherParties = await User.find({
      phoneNumber: { $in: formattedOtherPartyPhoneNumbers },
    }).lean();

    let queryArray = [
      {
        senderId: requestUserId,
        receiverPhoneNumber: { $in: formattedOtherPartyPhoneNumbers },
        status: { $ne: Const.transferPrepayment },
      },
    ];

    const otherPartyAvatars = {};
    if (otherParties.length !== 0) {
      otherParties.forEach((otherParty) => {
        queryArray.push({
          senderId: otherParty._id.toString(),
          receiverPhoneNumber: request.user.phoneNumber,
          status: Const.transferComplete,
        });

        let avatar;
        if (otherParty && otherParty.avatar) {
          if (otherParty.avatar.thumbnail.link) {
            avatar = otherParty.avatar.thumbnail.link;
          } else {
            avatar = `${Config.webClientUrl}/api/v2/avatar/user/${otherParty.avatar.thumbnail.nameOnServer}`;
          }
          otherPartyAvatars[otherParty.phoneNumber] = avatar;
          otherPartyAvatars[otherParty._id.toString()] = avatar;
        }
      });
    }

    const transfers = await Transfer.find({ $or: queryArray })
      .limit(itemsPerPage)
      .skip((page - 1) * itemsPerPage)
      .sort({ created: -1 })
      .lean();
    const total = await Transfer.find({ $or: queryArray }).countDocuments();

    const transferList = transfers.map((transfer) => {
      const { _id: transferId, created: date, status, transferType } = transfer;
      const transferData = {
        transferId: transferId.toString(),
        date,
        status,
        transferType,
      };

      if (transfer.senderId === requestUserId) {
        let action;
        if (status === Const.transferWaitingForFulfillment) {
          action = "Pending";
          transferData.information = "Transaction has been charged. Waiting for fulfillment.";
        } else if (status === Const.transferComplete) {
          action = "Sent";
        } else {
          action = "Failed";
          transferData.information =
            "Transaction has failed and Flom support was contacted to deal with the problem.";
        }

        transferData.description = { action, product: transfer.productName };
        transferData.receiverPhoneNumber = transfer.receiverPhoneNumber;
        transferData.to = transfer.receiverPhoneNumber;

        otherParties.forEach((otherParty) => {
          if (otherParty.phoneNumber === transfer.receiverPhoneNumber) {
            transferData.contactUsername = otherParty.name;
          }
        });
      } else {
        transferData.description = { action: "Received", product: transfer.productName };
        transferData.senderId = transfer.senderId;
        transferData.from = transfer.senderPhoneNumber;

        otherParties.forEach((otherParty) => {
          if (otherParty.phoneNumber === transfer.senderPhoneNumber) {
            transferData.contactUsername = otherParty.name;
          }
        });
      }
      return transferData;
    });

    if (Object.entries(otherPartyAvatars).length !== 0) {
      for (let i = 0; i < transferList.length; i++) {
        if (otherPartyAvatars[transferList[i].receiverPhoneNumber]) {
          transferList[i].avatar = otherPartyAvatars[transferList[i].receiverPhoneNumber];
        } else if (otherPartyAvatars[transferList[i].senderId]) {
          transferList[i].avatar = otherPartyAvatars[transferList[i].senderId];
        }
      }
    }

    transferList.forEach((transfer) => {
      if (transfer.receiverPhoneNumber) {
        delete transfer.receiverPhoneNumber;
      } else if (transfer.senderId) {
        delete transfer.senderId;
      }
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      transfers: transferList,
      total,
      hasNext: page * itemsPerPage < total,
    });
  } catch (error) {
    Base.newErrorResponse({ response, message: "UserTransfersController", error });
  }
});

module.exports = router;
