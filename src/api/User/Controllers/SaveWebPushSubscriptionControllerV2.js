"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {method} /api/v2/sample/:urlParamArg Sample API flom_v1
 * @apiVersion 2.0.16
 * @apiName  Sample API flom_v1
 * @apiGroup WebAPI Sample API
 * @apiDescription  Sample API.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * // Query string args:
 * @apiParam (Query string) {String} [artist]  Sample
 * @apiParam (Query string) {String} [title]   Sample
 * // Request Body args:
 * @apiParam {String}                sample    Sample
 * @apiParam {Number}                [sample]  Sample
 * @apiParam {File}                  sample    Sample
 *
 * @apiSuccessExample Success Response
 * {
 *      // add postman response here
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 000000 Sample error
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { pushSubscription = {} } = request.body;

    if (!pushSubscription || _.isEmpty(pushSubscription)) {
      logger.error("SaveWebPushSubscriptionControllerV2, wrong token");
      return Base.successResponse(response, Const.responsecodeSavePushTokenWrongToken);
    }

    const { user } = request;
    const userId = user._id.toString();
    const { webPushSubscription = [] } = user;

    const responseData = { user };

    if (!webPushSubscription.find((sub) => sub.endpoint === pushSubscription.endpoint)) {
      pushSubscription.created = Date.now();

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { webPushSubscription: { $each: [pushSubscription], $slice: -5 } } },
        { new: true, lean: true },
      );

      responseData.user = updatedUser;
    }

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SaveWebPushSubscriptionControllerV2",
      error,
    });
  }
});

module.exports = router;
