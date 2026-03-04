"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { BlessPacket } = require("#models");

/**
 * @api {delete} /api/v2/flomoji/:flomojiId Delete flomoji flom_v1
 * @apiVersion 2.0.10
 * @apiName  Delete flomoji flom_v1
 * @apiGroup WebAPI Flomoji
 * @apiDescription  API which is called to delete a flomoji
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1656404724285,
 *     "data": {
 *         "deletedFlomoji": {
 *             "emoji": {
 *                 "originalFileName": "istockphoto-646511174-612x612.jpg",
 *                 "nameOnServer": "lRlxdliNN08o50GKeUNKy3asKi9xHh3b.jpg",
 *                 "mimeType": "image/jpeg",
 *                 "size": 24652,
 *                 "height": 612,
 *                 "width": 612
 *             },
 *             "smallEmoji": {
 *                 "originalFileName": "istockphoto-646511174-612x612_small.jpg",
 *                 "nameOnServer": "bYQwWkru21fANapDt6vY8Fdac0IcrWXx.jpg",
 *                 "mimeType": "image/jpeg",
 *                 "size": 2696,
 *                 "height": 20,
 *                 "width": 20
 *             },
 *             "isDeleted": true,
 *             "created": 1656338710140,
 *             "_id": "62b9b916dbe396236047a77f",
 *             "title": "toto",
 *             "amount": 5,
 *             "position": 0,
 *             "emojiFileName": "lRlxdliNN08o50GKeUNKy3asKi9xHh3b.jpg",
 *             "smallEmojiFileName": "bYQwWkru21fANapDt6vY8Fdac0IcrWXx.jpg",
 *             "__v": 0
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
 * @apiError (Errors) 443601 No flomoji ID
 * @apiError (Errors) 443602 Flomoji not found
 * @apiError (Errors) 443608 Problem while deleting flomoji from database
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/:flomojiId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const flomojiId = request.params.flomojiId;

      if (!flomojiId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoFlomojiId,
          message: "DeleteFlomojiController, DELETE - no flomoji ID",
        });
      }

      const flomoji = await BlessPacket.findOne({ _id: flomojiId }).lean();

      if (!flomoji) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeFlomojiNotFound,
          message: "DeleteFlomojiController, DELETE - no flomoji found with given ID",
        });
      }

      await BlessPacket.updateMany(
        { position: { $gt: flomoji.position } },
        { $inc: { position: -1 } },
      );

      const result = await BlessPacket.findByIdAndUpdate(
        flomoji._id,
        { isDeleted: true, position: 0 },
        { new: true },
      );

      if (!result) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeDeleteFlomojiProblem,
          message:
            "DeleteFlomojiController, DELETE - there was a problem with deleting the flomoji",
        });
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        deletedFlomoji: result.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "DeleteFlomojiController, DELETE",
        error,
      });
    }
  },
);

module.exports = router;
