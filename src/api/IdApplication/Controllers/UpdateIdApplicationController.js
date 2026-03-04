"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { IdApplication, User } = require("#models");
const { sendNotifications, sendPushNotifications } = require("../helpers");

/**
 * @api {patch} /api/v2/id-applications/:applicationId Update ID application status flom_v1
 * @apiVersion 2.0.21
 * @apiName Update ID application status
 * @apiGroup WebAPI ID application
 * @apiDescription API for updating ID application status. Only admin token allowed.
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam {Number} approvalStatus     Approval status of the application (2 - rejected, 3 - approved)
 * @apiParam {String} [approvalComment]  Approval comment. To delete comment send empty string
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636552623882,
 *   "data": {
 *     "idApplication": {
 *       "idPhotos": [
 *         {
 *           "file": {
 *             "originalName": "front.jpg",
 *             "nameOnServer": "HJNiNZpHm1sHxx3nNiMhRO05icgCB9vY",
 *             "size": 2384387,
 *             "mimeType": "image/png"
 *           },
 *           "fileType": 0,
 *           "order": 0
 *         },
 *         {
 *           "file": {
 *             "originalName": "back.jpg",
 *             "nameOnServer": "3kKVdW1wHnr4zb17lxR2d6cu8rCigJPu",
 *             "size": 2384387,
 *             "mimeType": "image/png"
 *           },
 *           "fileType": 0,
 *           "order": 1
 *         }
 *       ],
 *       "approvalStatus": 2,
 *       "approvalComment": "Congrats! You have been approved!",
 *       "created": 1636552623842,
 *       "modified": 1636552677777,
 *       "_id": "618bcfaf0c3de3a97fcc16a8",
 *       "userId": "5f7ee464a283bc433d9d722f",
 *       "userName": "mdragic",
 *       "countryCode": "HR",
 *       "country": "Croatia",
 *       "phoneNumber": "+2348020000007",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "dateOfBirth": 1636552623842
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443218 ApplicationId is not a valid id
 * @apiError (Errors) 443901 ID application with applicationId not found
 * @apiError (Errors) 443430 Invalid approval status
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/:applicationId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { applicationId } = request.params;
      const approvalStatus = +request.body.approvalStatus;
      const approvalComment = request.body.approvalComment || "";

      if (!Utils.isValidObjectId(applicationId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNotValidId,
          message: `UpdateIdApplicationController, applicationId is not a valid id`,
        });
      }

      const idApplication = await IdApplication.findOne({ _id: applicationId });
      if (!idApplication) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeIdApplicationNotFound,
          message: `UpdateIdApplicationController, id application not found`,
        });
      }

      if ([2, 3].indexOf(approvalStatus) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidApprovalStatus,
          message: `UpdateIdApplicationController, invalid approvalStatus`,
        });
      }

      idApplication.approvalStatus = approvalStatus;
      idApplication.approvalComment = approvalComment;
      idApplication.modified = Date.now();
      await idApplication.save();

      const idApplicationObj = idApplication.toObject();
      delete idApplicationObj.__v;

      let identityStatus;
      if (approvalStatus === Const.idApplicationStatusRejected) {
        identityStatus = Const.identityStatusInvalid;
      }
      if (approvalStatus === Const.idApplicationStatusApproved) {
        identityStatus = Const.identityStatusVerified;
      }

      const user = await User.findByIdAndUpdate(
        idApplicationObj.userId,
        { identityStatus },
        { new: true },
      );

      if (user.pushToken.length) {
        await sendPushNotifications({
          pushTokens: user.pushToken,
          approvalStatus,
          approvalComment,
        });
      }
      await sendNotifications({
        userId: user._id.toString(),
        approvalStatus,
        approvalComment,
        idApplicationId: applicationId,
      });

      const responseData = { idApplication: idApplicationObj };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateIdApplicationController",
        error,
      });
    }
  },
);

module.exports = router;
