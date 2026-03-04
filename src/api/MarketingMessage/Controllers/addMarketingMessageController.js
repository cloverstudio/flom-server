"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { MarketingMessage } = require("#models");

/**
      * @api {post} /api/v2/marketing-messages/add Add Marketing Message
      * @apiName Add Marketing Message
      * @apiGroup WebAPI
      * @apiDescription Add Marketing Message
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

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.user._id.toString();
    const marketingAction = request.body.marketingAction;
    const message = request.body.message;
    const receivers = request.body.receivers;
    const product = request.body.product;
    const template = request.body.template || false;
    const name = request.body.name;
    const phoneNumbersFromCSV = request.body.phoneNumbersFromCSV;

    const isValidAction = validateMarketingAction(marketingAction);
    const isValidReceivers = validateReceivers(receivers);

    if (!isValidAction) {
      return Base.successResponse(response, Const.responsecodeInvalidMarketingAction);
    }

    if (!message) {
      return Base.successResponse(response, Const.responsecodeNoMarketingMessage);
    }

    if (marketingAction == 2 && !product) {
      return Base.successResponse(response, Const.responsecodeNoMarketingProductId);
    }

    if (!isValidReceivers) {
      return Base.successResponse(response, Const.responsecodeNotValidToId);
    }

    const newMarketingMessage = new MarketingMessage({
      userId,
      marketingAction,
      message,
      receivers,
      template,
      created: Utils.now(),
      ...(name && { name }),
      ...(marketingAction == 2 && { product }),
      ...(phoneNumbersFromCSV && { phoneNumbersFromCSV }),
    });

    await newMarketingMessage.save();

    function validateReceivers(receivers) {
      if (!receivers) {
        return false;
      }

      const validatedReceivers = receivers.map((r) => {
        let id = r.id;
        // Check params
        if (id && !Utils.isValidObjectId(id)) {
          return false;
        } else {
          return true;
        }
      });

      if (validatedReceivers.indexOf(false) > -1) {
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
    Base.errorResponse(response, Const.httpCodeServerError, "addMarketingMessageController", e);
    return;
  }
});

module.exports = router;
