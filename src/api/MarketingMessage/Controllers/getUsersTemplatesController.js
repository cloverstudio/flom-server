"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { MarketingMessage } = require("#models");

/**
      * @api {get} /api/v2/marketing-messages/templates/ Get Users Marketing Templates
      * @apiName Get Users Marketing Templates
      * @apiGroup WebAPI
      * @apiDescription Get Users Marketing Templates
      * 
      * @apiHeader {String} access-token Users unique access-token.
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
    const userId = request.user._id.toString();

    const marketingTemplates = await MarketingMessage.find({
      userId,
      template: true,
    }).sort({ created: -1 });

    let dataToSend = {};

    dataToSend.marketingTemplates = marketingTemplates.map((m) => m.toObject());

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "getUsersTemplatesController", e);
    return;
  }
});

module.exports = router;
