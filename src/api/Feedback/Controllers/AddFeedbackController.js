"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Feedback } = require("#models");
const { sendBonus } = require("#logics");

/**
 * @api {post} /api/v2/feedback/add Add Feedbacks
 * @apiName Add Feedbacks
 * @apiGroup WebAPI
 * @apiDescription Add Feedbacks
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {Object[]} feedback object - array of feedbacks
 * @apiParam {String} feedback.question
 * @apiParam {String[]} feedback.answer - array of strings
 * @apiParam {Number} feedback.rate
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1542971764382,
 *     "data": {}
 * }
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const phoneNumber = request.user.phoneNumber;
    const userId = request.user._id.toString();
    const rawFeedbacks = request.body.feedbacks;
    const sendAirtime = request.body.sendAirtime;

    const nigerianNumber = phoneNumber.startsWith("+234");
    console.log({ sendAirtime });

    const feedbacks = rawFeedbacks.map((feedback) => {
      feedback.answer = feedback.answer.filter((answer) => answer);

      return feedback;
    });

    if (feedbacks.length === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        sentGift: 2,
      });
    }

    const feedback = await Feedback.findOneAndUpdate(
      { userId },
      { data: feedbacks, userId },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const feedbackId = feedback._id.toString();

    if (!nigerianNumber) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        sentGift: -1,
      });
    }

    if (!sendAirtime) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        sentGift: 2,
      });
    }

    await sendBonus({ userId, bonusType: Const.bonusTypeFeedback, feedbackId });

    Base.successResponse(response, Const.responsecodeSucceed, {
      sentGift: 1,
    });
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "AddFeedbackController", e);
    return;
  }
});

module.exports = router;
