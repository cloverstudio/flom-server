"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { MarketingMessage } = require("#models");

/**
      * @api {post} /api/v2/marketing-messages/edit/:id Edit Marketing Message
      * @apiName Edit Marketing Message
      * @apiGroup WebAPI
      * @apiDescription Edit Marketing Message
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {Number} marketingAction marketingAction
      * @apiParam {String} message message
      * @apiParam {Array} to to / array of userIds + userNames
      * @apiParam {String} product product / object with productId and productName
      * @apiParam {Boolean} template template
      * 
      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1542971764382,
            "data": {
            
            }
        }
            
    **/

router.post("/:id", auth({ allowUser: true }), async function (request, response) {
  try {
    const messageId = request.params.id;
    const marketingAction = request.body.marketingAction;
    const message = request.body.message;
    const receivers = request.body.receivers;
    const product = request.body.product;
    const template = request.body.template;
    const name = request.body.name;
    const phoneNumbersFromCSV = request.body.phoneNumbersFromCSV;

    const isValidAction = validateMarketingAction(marketingAction);
    const isValidReceivers = validateReceivers(receivers);

    if (marketingAction && !isValidAction) {
      return Base.successResponse(response, Const.responsecodeInvalidMarketingAction);
    }

    if (marketingAction == 2 && !product) {
      return Base.successResponse(response, Const.responsecodeNoMarketingProductId);
    }

    if (receivers && !isValidReceivers) {
      return Base.successResponse(response, Const.responsecodeNotValidToId);
    }

    await MarketingMessage.findByIdAndUpdate(messageId, {
      $set: {
        ...(marketingAction && { marketingAction }),
        ...(message && { message }),
        ...(typeof receivers != "undefined" && {
          receivers,
        }),
        ...(typeof template != "undefined" && { template }),
        ...(name && { name }),
        ...(product && { product }),
        ...(phoneNumbersFromCSV && { phoneNumbersFromCSV }),
      },
    });

    function validateReceivers(to) {
      if (!to) {
        return false;
      }

      const validatedTo = to.map((r) => {
        let id = r.id;
        // Check params
        if (id && !Utils.isValidObjectId(id)) {
          return false;
        } else {
          return true;
        }
      });

      if (validatedTo.indexOf(false) > -1) {
        return false;
      }

      return true;
    }

    function validateMarketingAction(action) {
      if (!action) {
        return false;
      }

      const options = [1, 2, 3, 4];

      if (options.indexOf(Number(action)) == -1) {
        return false;
      }

      return true;
    }
    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "editMarketingMessageController", e);
    return;
  }
});

module.exports = router;
