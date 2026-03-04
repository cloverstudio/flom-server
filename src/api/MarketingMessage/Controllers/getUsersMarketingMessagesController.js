"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { MarketingMessage } = require("#models");

/**
      * @api {get} /api/v2/marketing-messages/ Get Users Marketing Message
      * @apiName Get Users Marketing Message
      * @apiGroup WebAPI
      * @apiDescription Get Users Marketing Message
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiQueryParam {Number} newerThan newerThan	/optional
	  * 
      * 
      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1542971764382,
            "data": {
            
            }
        }
            
    **/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const newerThan = request.query.newerThan;
    const userId = request.user._id.toString();

    const marketingMessages = await MarketingMessage.find({
      userId,
      template: false,
      ...(newerThan && { created: { $gt: Number(newerThan) } }),
    }).sort({ created: -1 });

    let dataToSend = {};

    dataToSend.marketingMessages = [];

    if (marketingMessages) {
      dataToSend.marketingMessages = marketingMessages.map((m) => m.toObject());
    }

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "getUsersMarketingMessagesController",
      e,
    );
    return;
  }
});

/**
      * @api {get} /api/v2/marketing-messages/:id Get Marketing Message By Id
      * @apiName Get Marketing Message By Id
      * @apiGroup WebAPI
      * @apiDescription Get Marketing Message By Id
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {String} id id
      * 
      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1542971764382,
            "data": {
            
            }
        }
            
    **/

router.get("/:id", auth({ allowUser: true }), async function (request, response) {
  try {
    const messageId = request.params.id;

    const marketingMessage = await MarketingMessage.findById(messageId);

    let dataToSend = {};

    dataToSend.marketingMessage = marketingMessage.toObject();

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "getUsersMarketingMessagesController by id",
      e,
    );
    return;
  }
});

module.exports = router;
