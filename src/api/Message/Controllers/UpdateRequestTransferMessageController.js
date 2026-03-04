"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Message } = require("#models");

/**
 * @api {get} /api/v2/message/update-request/:requestTransferId/:confirmationState Update request transfer message status
 * @apiName Update request transfer message status
 * @apiGroup WebAPI
 * @apiDescription Updates the isConfirmed property of the appropriate request transfer message.
 * @apiHeader {String} access-token Users unique access-token.
 * @apiParam {String} requestTransferId    ID of the request transfer
 * @apiParam {Boolean} confirmationState    Confirmation state of the request transfer
 *
 * @apiSuccessExample Success-Response:
 */

router.get(
  "/:requestTransferId/:confirmationState",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const id = request.params.requestTransferId;
      const confirmState = +request.params.confirmationState > 0 ? true : false;
      const status = confirmState ? "accepted" : "rejected";

      logger.info("UpdateRequestMessageController Request Id: " + id + " status: " + status);

      const updatedMessage = await Message.findOneAndUpdate(
        {
          $or: [
            { "attributes.transferInfo.requestTransferId": id },
            {
              "attributes.transferInfo.groupRequestTransferId": { $exists: true },
              "attributes.transferInfo.transferId": id,
            },
          ],
        },

        {
          "attributes.transferInfo.isConfirmed": confirmState,
          "attributes.transferInfo.status": status,
        },
        { new: true },
      ).lean();

      if (updatedMessage) {
        Base.successResponse(response, Const.responsecodeSucceed, { isUpdated: true });
      } else {
        Base.successResponse(response, Const.responsecodeSucceed, { isUpdated: false });
      }
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateRequestMessageController",
        error,
      });
    }
  },
);

module.exports = router;
