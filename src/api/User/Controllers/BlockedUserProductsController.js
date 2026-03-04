"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {patch} /api/v2/users/blocked Update users blocked product types
 * @apiVersion 2.0.8
 * @apiName Update users blocked product types
 * @apiGroup WebAPI User
 * @apiDescription API for blocking/unblocking users products and ability to post new products.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} userId Id of the user whose featured product types should be updated.
 * @apiParam {String} action "block" - to block product with type, "unblock" - to unblock product with type
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "user": {
 *       "id": "60e4384b560d1466637e3eca",
 *       "phoneNumber": "+2348020000019",
 *       "username": "floMaster",
 *       "email": "flom@master.com",
 *       "firstName": "Flom",
 *       "lastName": "Master",
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped337518704814023559.jpg",
 *           "size": 5465474,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-mPXy2j7CJfHbB9XYMdNTiTEV",
 *           "link": "https://dev.flom.app/api/v2/avatar/user/profile-mPXy2j7CJfHbB9XYMdNTiTEV"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped337518704814023559.jpg",
 *           "size": 105000,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-g5lv1oTLosE8yn1O7wmhNMnI2r",
 *           "link": "https://dev.flom.app/api/v2/avatar/user/thumb-g5lvboTLosE8yn1O7wmhNMnI2r"
 *         }
 *       },
 *       "featuredProductTypes": [ 1 , 2 ],
 *       "blockedProducts": 0 // 0 - false, 1 - true
 *     },
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400121 No productType parameter
 * @apiError (Errors) 443226 Invalid productType parameter (has to be between 1 and 5)
 * @apiError (Errors) 443230 Invalid userId parameter
 * @apiError (Errors) 443231 No action parameter
 * @apiError (Errors) 443232 Invalid action parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000110 No userId parameter
 * @apiError (Errors) 4000760 User with userId not found
 */

router.patch(
  "/",
  auth({
    allowAdmin: true,
    role: Const.Role.ADMIN,
  }),
  async (request, response) => {
    try {
      const { userId, action } = request.body;
      if (!userId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoUserId,
          message: `BlockedUserProductsController, no userId parameter`,
        });
      }
      if (!Utils.isValidObjectId(userId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidUserId,
          message: `BlockedUserProductsController, invalid userId parameter`,
        });
      }

      const user = await User.findOne({ _id: userId });
      if (!user) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotFound,
          message: `BlockedUserProductsController, user with id ${userId} not found`,
        });
      }

      if (!action) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoAction,
          message: `BlockedUserProductsController, no action parameter`,
        });
      }
      if (action !== "block" && action !== "unblock") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message: `BlockedUserProductsController, invalid action parameter`,
        });
      }

      if (action === "block" && user.blockedProducts === 0) {
        user.blockedProducts = 1;
        await user.save();
      } else if (action === "unblock" && user.blockedProducts === 1) {
        user.blockedProducts = 0;
        await user.save();
      }

      const userObject = user.toObject();
      Base.successResponse(response, Const.responsecodeSucceed, {
        user: {
          id: userObject._id.toString(),
          phoneNumber: userObject.phoneNumber,
          username: userObject.userName,
          email: userObject.email,
          firstName: userObject.firstName,
          lastName: userObject.lastName,
          avatar: userObject.avatar,
          featured: userObject.featured || { types: [], countryCode: "default" },
          blockedProducts: userObject.blockedProducts || 0,
        },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "BlockedUserProductsController",
        error,
      });
    }
  },
);

module.exports = router;
