"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { IdApplication, User } = require("#models");
const { handleImageFile } = require("../helpers");

/**
 * @api {post} /api/v2/id-applications Create ID application flom_v1
 * @apiVersion 2.0.21
 * @apiName Create ID application
 * @apiGroup WebAPI ID application
 * @apiDescription API for creating new ID application
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} firstName    First name
 * @apiParam {String} lastName     Last name
 * @apiParam {Number} dateOfBirth  Date of birth in UTC time (milliseconds passed since 1970)
 * @apiParam {File}   file0        Image of the front of the ID
 * @apiParam {File}   [file1]      Image of the back of the ID
 * @apiParam {File}   file2        Baseie image
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
 * @apiError (Errors) 443100 No first name parameter
 * @apiError (Errors) 443101 No last name parameter
 * @apiError (Errors) 443420 No date of birth parameter
 * @apiError (Errors) 443427 Invalid files count. There needs to be at least 2 photo files (front and Baseie and back if id card is provided)
 * @apiError (Errors) 443428 Invalid file type. Can only be images
 * @apiError (Errors) 443434 Pending or approved application of user already exists
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const userCountryCode =
      user.countryCode ||
      Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber }) ||
      "Unknown country";
    const userCountry = countries[userCountryCode]?.name || "Unknown country";

    const { fields, files } = await Utils.formParse(request);
    const { firstName, lastName, dateOfBirth: dob } = fields;
    const dateOfBirth = +dob;

    const idApplicationTest = await IdApplication.findOne({
      userId,
      status: {
        $in: [Const.idApplicationStatusPending, Const.idApplicationStatusApproved],
      },
    }).lean();

    if (idApplicationTest) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeApplicationAlreadyExists,
        message: `CreateIdApplicationController, pending or approved application with userId already exists`,
      });
    }

    if (!firstName || typeof firstName !== "string") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFirstName,
        message: `CreateIdApplicationController, no first name`,
      });
    }
    if (!lastName || typeof lastName !== "string") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoLastName,
        message: `CreateIdApplicationController, no last name`,
      });
    }
    if (!dateOfBirth || typeof dateOfBirth !== "number") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoDateOfBirth,
        message: `CreateIdApplicationController, no dateOfBirth`,
      });
    }

    const idApplicationData = {
      userId,
      countryCode: userCountryCode,
      country: userCountry,
      userName: user.userName,
      phoneNumber: user.phoneNumber,
      firstName,
      lastName,
      dateOfBirth,
    };

    const fileKeys = Object.keys(files);

    if (fileKeys.length < 2 || fileKeys.length > 3) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidFilesCount,
        message: `CreateIdApplicationController, invalid files count`,
      });
    }

    if (fileKeys.length == 2) {
      if (
        files[fileKeys[0]].type.indexOf("image") === -1 ||
        files[fileKeys[1]].type.indexOf("image") === -1
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidFileType,
          message: `CreateIdApplicationController, invalid file type`,
        });
      }
    } else if (fileKeys.length == 3) {
      if (
        files[fileKeys[0]].type.indexOf("image") === -1 ||
        files[fileKeys[1]].type.indexOf("image") === -1 ||
        files[fileKeys[2]].type.indexOf("image") === -1
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidFileType,
          message: `CreateIdApplicationController, invalid file type`,
        });
      }
    }

    let order = 0;
    const allFiles = [];
    if (fileKeys.length) {
      for (let i = 0; i < fileKeys.length; i++) {
        const file = files[fileKeys[i]];

        let fileData = await handleImageFile(file);

        fileData.order = order++;
        allFiles.push(fileData);
      }
    }

    idApplicationData.idPhotos = allFiles;

    const idApplication = await IdApplication.create(idApplicationData);
    await User.updateOne(
      { _id: user._id },
      { idApplicationStatus: Const.idApplicationStatusPending },
    );
    const idApplicationObj = idApplication.toObject();
    delete idApplicationObj.__v;

    const responseData = { idApplication: idApplicationObj };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateIdApplicationController",
      error,
    });
  }
});

module.exports = router;
