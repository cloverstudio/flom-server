"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { IdApplication } = require("#models");

/**
 * @api {get} /api/v2/id-applications/:applicationId Get ID application flom_v1
 * @apiVersion 2.0.21
 * @apiName Get ID application
 * @apiGroup WebAPI ID application
 * @apiDescription API for fetching an ID application. Admin token required.
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
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
 *       "approvalStatus": 1,
 *       "created": 1636552623842,
 *       "modified": 1636552623842,
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
 * @apiError (Errors) 443901 ID application not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/:applicationId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { applicationId } = request.params;

      if (!Utils.isValidObjectId(applicationId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNotValidId,
          message: `GetIdApplicationController, applicationId is not a valid id`,
        });
      }

      const idApplication = await IdApplication.findOne({ _id: applicationId }).lean();
      if (!idApplication) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeIdApplicationNotFound,
          message: `GetIdApplicationController, id application not found`,
        });
      }
      delete idApplication.__v;

      const responseData = { idApplication };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetIdApplicationController",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/id-applications Get ID applications list
 * @apiVersion 2.0.21
 * @apiName Get ID applications list
 * @apiGroup WebAPI ID application
 * @apiDescription API for getting list of ID applications. Only admin token allowed.
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} [approvalStatus]  Approval status (1 - pending, 2 - rejected, 3 - approved)
 * @apiParam (Query string) {String} [userName]        Users userName
 * @apiParam (Query string) {String} [phoneNumber]     Users phone number
 * @apiParam (Query string) {String} [page]            Page number for paging (default 1)
 * @apiParam (Query string) {String} [itemsPerPage]    Number of items per page for paging (default 10)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636626365568,
 *   "data": {
 *     "idApplications": [
 *       {
 *         "idPhotos": [
 *           {
 *             "file": {
 *               "originalName": "front.jpg",
 *               "nameOnServer": "HJNiNZpHm1sHxx3nNiMhRO05icgCB9vY",
 *               "size": 2384387,
 *               "mimeType": "image/png"
 *             },
 *             "fileType": 0,
 *             "order": 0
 *           },
 *           {
 *             "file": {
 *               "originalName": "back.jpg",
 *               "nameOnServer": "3kKVdW1wHnr4zb17lxR2d6cu8rCigJPu",
 *               "size": 2384387,
 *               "mimeType": "image/png"
 *             },
 *             "fileType": 0,
 *             "order": 1
 *           }
 *         ],
 *         "approvalStatus": 1,
 *         "created": 1636552623842,
 *         "modified": 1636552623842,
 *         "_id": "618bcfaf0c3de3a97fcc16a8",
 *         "userId": "5f7ee464a283bc433d9d722f",
 *         "userName": "mdragic",
 *         "countryCode": "HR",
 *         "country": "Croatia",
 *         "phoneNumber": "+2348020000007",
 *         "firstName": "M",
 *         "lastName": "D",
 *         "dateOfBirth": 1636552623842
 *       }
 *     ],
 *     "pagination": {
 *       "total": 1,
 *       "itemsPerPage": 10
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
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { userName, phoneNumber } = request.query;
      const approvalStatus = +request.query.approvalStatus || undefined;
      const page = +request.query.page || 1;
      const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;
      const searchQuery = {};

      if (userName && userName !== "") {
        searchQuery["userName"] = new RegExp(userName, "i");
      }
      if (phoneNumber && phoneNumber !== "") {
        const formattedPhoneNumber = Utils.formatPhoneNumber({ phoneNumber });
        if (formattedPhoneNumber) {
          searchQuery["phoneNumber"] = formattedPhoneNumber;
        }
      }
      if ([1, 2, 3].indexOf(approvalStatus) !== -1) {
        searchQuery["approvalStatus"] = approvalStatus;
      }

      const idApplications = await IdApplication.find(searchQuery)
        .sort({ created: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean();

      const total = await IdApplication.find(searchQuery).countDocuments();

      const responseData = { idApplications, pagination: { total, itemsPerPage } };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "GetIdApplicationController, list",
        error,
      });
    }
  },
);

module.exports = router;
