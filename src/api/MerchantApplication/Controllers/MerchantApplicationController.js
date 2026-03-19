"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { MerchantApplication, User, Bank, Notification } = require("#models");
const { sendBonus } = require("#logics");
const sharp = require("sharp");
const fsp = require("fs/promises");

/**
 * @api {post} /api/v2/merchant-applications Add new merchant application
 * @apiVersion 2.0.9
 * @apiName Add new merchant application
 * @apiGroup WebAPI Merchant application
 * @apiDescription API for creating new merchant application
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} firstName First name
 * @apiParam {String} lastName Last name
 * @apiParam {String} dateOfBirth Date of birth
 * @apiParam {String} streetName Street name
 * @apiParam {String} streetNumber Street number
 * @apiParam {String} city City name
 * @apiParam {String} zip Zip/postal code
 * @apiParam {String} [paypalEmail] Paypal email address
 * @apiParam {String} [taxIN] Tax identification number
 * @apiParam {String} [bankId] Id of the bank from FLOM database
 * @apiParam {String} [bankName] Name of the bank
 * @apiParam {String} [bankCountry] Country of the bank
 * @apiParam {String} bankAccountNumber Bank account number
 * @apiParam {String} [routingNumber] Routing number
 * @apiParam {File} file0 Image of the front of the ID
 * @apiParam {File} [file1] Image of the back of the ID
 * @apiParam {File} file2 Selfie image
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636552623882,
 *   "data": {
 *     "merchantApplication": {
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
 *       "_id": "618bcfaf0c3de3a97fcc16a8",
 *       "userId": "5f7ee464a283bc433d9d722f",
 *       "username": "mdragic",
 *       "phoneNumber": "+2348020000007",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "dateOfBirth": "5153477845",
 *       "streetName": "Street",
 *       "streetNumber": "2",
 *       "city": "Tokyo",
 *       "zip": "55555",
 *       "paypalEmail": "mdragic@gmail.com",
 *       "paypalAmountSent": undefined,
 *       "paypalAmountReceived": undefined,
 *       "taxIN": 1111,
 *       "bankName": "Bank of Japan",
 *       "bankCountry": "Japan",
 *       "bankAccountNumber": "555555555",
 *       "bankCode": "033",
 *       "routingNumber": 232432,
 *       "merchantCode": "17568392"
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
 * @apiError (Errors) 443411 Invalid contentId parameter
 * @apiError (Errors) 443420 No date of birth parameter
 * @apiError (Errors) 443421 No street name parameter
 * @apiError (Errors) 443422 No streetNumber name parameter
 * @apiError (Errors) 443423 No city parameter
 * @apiError (Errors) 443424 No zip parameter
 * @apiError (Errors) 443425 No bank country parameter
 * @apiError (Errors) 443426 No bank account number parameter
 * @apiError (Errors) 443427 Invalid files count. There needs to be at least 2 photo files (front and selfie and back if id card is provided)
 * @apiError (Errors) 443428 Invalid file type. Can only be images
 * @apiError (Errors) 443431 No bank name parameter
 * @apiError (Errors) 443434 Pending or approved application of user already exists
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { fields, files } = await Utils.formParse(request);
    const {
      firstName,
      lastName,
      dateOfBirth,
      streetName,
      streetNumber,
      city,
      zip,
      paypalEmail,
      taxIN,
      bankId,
      bankName,
      bankCountry,
      bankAccountNumber,
      routingNumber,
    } = fields;

    const merchantApplicationTest = await MerchantApplication.findOne({
      userId: user._id.toString(),
      status: {
        $in: [
          Const.merchantApplicationStatusPending,
          Const.merchantApplicationStatusPendingPaypalSent,
          Const.merchantApplicationStatusPendingPaypalReceived,
          Const.merchantApplicationStatusApprovedWithoutPayout,
          Const.merchantApplicationStatusApprovedWithPayout,
        ],
      },
    }).lean();

    if (merchantApplicationTest) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeApplicationAlreadyExists,
        message: `MerchantApplicationController - add new merchant application, pending or approved application with userId already exists`,
      });
    }

    if (!firstName) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoFirstName,
        message: `MerchantApplicationController - add new merchant application, no first name`,
      });
    }
    if (!lastName) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoLastName,
        message: `MerchantApplicationController - add new merchant application, no last name`,
      });
    }
    if (dateOfBirth === undefined || dateOfBirth === null) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoDateOfBirth,
        message: `MerchantApplicationController - add new merchant application, no date of birth`,
      });
    }
    if (!streetName) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoStreetName,
        message: `MerchantApplicationController - add new merchant application, no street name`,
      });
    }
    if (!streetNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoStreetNumber,
        message: `MerchantApplicationController - add new merchant application, no street number`,
      });
    }
    if (!city) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoCity,
        message: `MerchantApplicationController - add new merchant application, no city`,
      });
    }
    if (!zip) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoZip,
        message: `MerchantApplicationController - add new merchant application, no zip`,
      });
    }
    if (!bankId) {
      if (!bankName) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoBankName,
          message: `MerchantApplicationController - add new merchant application, no bank name`,
        });
      }
      if (!bankCountry) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoBankCountry,
          message: `MerchantApplicationController - add new merchant application, no bank country`,
        });
      }
    }
    if (!bankAccountNumber) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoBankAccountNumber,
        message: `MerchantApplicationController - add new merchant application, no bank account number`,
      });
    }

    let bank = null;
    if (bankId) {
      bank = await Bank.findById(bankId).lean();
      if (!bank) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeBankDoesNotExist,
          message: `MerchantApplicationController - add new merchant application, no bank in database with given id`,
        });
      }
    }

    const merchantApplicationData = {
      userId: user._id.toString(),
      username: user.userName,
      phoneNumber: user.phoneNumber,
      firstName,
      lastName,
      dateOfBirth,
      streetName,
      streetNumber,
      city,
      zip,
      paypalEmail: paypalEmail || null,
      taxIN: +taxIN || undefined,
      bankName: !bank ? bankName : bank.name,
      bankCountry: !bank ? bankCountry : countries[bank.countryCode].name,
      bankAccountNumber,
      bankCode: !bank ? "" : bank.code,
      routingNumber: !bank ? +routingNumber || undefined : bank.routingNumber,
    };

    const fileKeys = Object.keys(files);

    if (fileKeys.length < 2 || fileKeys.length > 3) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidFilesCount,
        message: `MerchantApplicationController - add new merchant application, invalid files count`,
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
          message: `MerchantApplicationController - add new merchant application, invalid file type`,
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
          message: `MerchantApplicationController - add new merchant application, invalid file type`,
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

    merchantApplicationData.idPhotos = allFiles;

    const merchantCode = await Utils.generateFakeMerchantCode();
    merchantApplicationData.merchantCode = merchantCode;

    const merchantApplication = await MerchantApplication.create(merchantApplicationData);
    await User.updateOne(
      { _id: user._id },
      { merchantApplicationStatus: Const.merchantApplicationStatusPending },
    );
    const merchantApplicationObj = merchantApplication.toObject();
    delete merchantApplicationObj.__v;

    Base.successResponse(response, Const.responsecodeSucceed, {
      merchantApplication: merchantApplicationObj,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MerchantApplicationController - add new merchant application",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/merchant-applications/:applicationId Get merchant application
 * @apiVersion 2.0.9
 * @apiName Get merchant application
 * @apiGroup WebAPI Merchant application
 * @apiDescription API for getting merchant application by id. Access allowed only for admin page. User needs at least admin role.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636552623882,
 *   "data": {
 *     "merchantApplication": {
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
 *       "approvalComment": "This is a comment!",
 *       "created": 1636552623842,
 *       "_id": "618bcfaf0c3de3a97fcc16a8",
 *       "userId": "5f7ee464a283bc433d9d722f",
 *       "username": "mdragic",
 *       "phoneNumber": "+2348020000007",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "dateOfBirth": "5153477845",
 *       "streetName": "Street",
 *       "streetNumber": "2",
 *       "city": "Tokyo",
 *       "zip": "55555",
 *       "paypalEmail": "mdragic@gmail.com",
 *       "paypalAmountSent": 1.33, (if not initialized value is null, or without this key)
 *       "paypalAmountReceived": 1.33, (if not initialized value is null, or without this key)
 *       "taxIN": 1111,
 *       "bankName": "Bank of Japan",
 *       "bankCountry": "Japan",
 *       "bankAccountNumber": "555555555",
 *       "routingNumber": 232432,
 *       "merchantCode": "17568392"
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
 * @apiError (Errors) 443429 Merchant application not found
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
          message: `MerchantApplicationController - get merchant application, applicationId is not a valid id`,
        });
      }

      const merchantApplication = await MerchantApplication.findOne({
        _id: applicationId,
      }).lean();
      if (!merchantApplication) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeMerchantApplicationNotFound,
          message: `MerchantApplicationController - get merchant application, merchant application not found`,
        });
      }
      delete merchantApplication.__v;

      Base.successResponse(response, Const.responsecodeSucceed, { merchantApplication });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "MerchantApplicationController - add new merchant application",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/merchant-applications Get merchant applications list
 * @apiVersion 2.0.9
 * @apiName Get merchant applications list
 * @apiGroup WebAPI Merchant application
 * @apiDescription API for getting list of merchant applications. Access allowed only for admin page. User needs at least admin role.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [approvalStatus] Approval status (1 - pending, 2 - rejected, 3 - approved without payout, 4 - pending, paypal sent, 5 - pending, paypal confirmed, 6 - approved with payout, 7 - pending, paypal email added)
 * @apiParam (Query string) {String} [username] Users username
 * @apiParam (Query string) {String} [phoneNumber] Users phone number
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [itemsPerPage] Number of items per page for paging (default 10)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636626365568,
 *   "data": {
 *     "merchantApplications": [
 *       {
 *         "_id": "618cd220f90550241e24231c",
 *         "approvalStatus": 1,
 *         "created": 1636627128670,
 *         "username": "ivooo",
 *         "phoneNumber": "+385976376676"
 *         "paypalEmail": "ivooo@gmail.com"
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
 * @apiError (Errors) 443427 Invalid files count. There needs to be 2 photo files
 * @apiError (Errors) 443428 Invalid file type. Can only be images
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { username, phoneNumber } = request.query;
      const approvalStatus = +request.query.approvalStatus || undefined;
      const page = +request.query.page || 1;
      const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;
      const searchQuery = {};

      if (username && username !== "") {
        searchQuery["username"] = new RegExp(username, "i");
      }
      if (phoneNumber && phoneNumber !== "") {
        const formattedPhoneNumber = Utils.formatPhoneNumber({ phoneNumber });
        if (formattedPhoneNumber) {
          searchQuery["phoneNumber"] = formattedPhoneNumber;
        }
      }
      if ([1, 2, 3, 4, 5, 6, 7].indexOf(approvalStatus) !== -1) {
        searchQuery["approvalStatus"] = approvalStatus;
      }

      const projectionQuery = {
        _id: 1,
        username: 1,
        phoneNumber: 1,
        approvalStatus: 1,
        paypalEmail: 1,
        created: 1,
      };

      const merchantApplications = await MerchantApplication.find(searchQuery, projectionQuery)
        .sort({ created: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean();

      const total = await MerchantApplication.find(searchQuery).countDocuments();

      Base.successResponse(response, Const.responsecodeSucceed, {
        merchantApplications,
        pagination: { total, itemsPerPage },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "MerchantApplicationController - get merchant applications list",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/merchant-applications/confirm-paypal-email/ Confirm paypal email in merchant application
 * @apiVersion 2.2.2
 * @apiName Confirm paypal email in merchant application
 * @apiGroup WebAPI Merchant application
 * @apiDescription API for updating merchant application with the amount user received from Flom into their paypal account in order to confirm paypal email address.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {Number} paypalAmountReceived Amount that user received in his paypal account.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636552623882,
 *   "data": {
 *     "updatedMerchantApplication": {
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
 *       "approvalComment": "This is a comment!",
 *       "created": 1636552623842,
 *       "_id": "618bcfaf0c3de3a97fcc16a8",
 *       "userId": "5f7ee464a283bc433d9d722f",
 *       "username": "mdragic",
 *       "phoneNumber": "+2348020000007",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "dateOfBirth": "5153477845",
 *       "streetName": "Street",
 *       "streetNumber": "2",
 *       "city": "Tokyo",
 *       "zip": "55555",
 *       "paypalEmail": "mdragic@gmail.com",
 *       "paypalAmountSent": 1.44,
 *       "paypalAmountReceived": 1.44,
 *       "taxIN": 1111,
 *       "bankName": "Bank of Japan",
 *       "bankCountry": "Japan",
 *       "bankAccountNumber": "555555555",
 *       "routingNumber": 232432,
 *       "merchantCode": "17568392"
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
 * @apiError (Errors) 443429 Merchant application of user not found
 * @apiError (Errors) 443433 No paypalAmountReceived parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000760 User not found
 */

router.patch(
  "/confirm-paypal-email/",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const token = request.headers["access-token"];
      const { paypalAmountReceived } = request.body;

      if (!paypalAmountReceived) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoAmountReceived,
          message: `MerchantApplicationController - confirm paypal email, no paypalAmountReceived parameter`,
        });
      }

      const user = await User.findOne({ "token.token": token });
      if (!user) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotFound,
          message: `MerchantApplicationController - user not found`,
        });
      }

      const merchantApplication = await MerchantApplication.findOne({
        userId: user._id.toString(),
        approvalStatus: Const.merchantApplicationStatusPendingPaypalSent,
      });
      if (!merchantApplication) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeMerchantApplicationNotFound,
          message: `MerchantApplicationController - confirm paypal email, merchant application not found`,
        });
      }

      merchantApplication.paypalAmountReceived = +paypalAmountReceived;
      merchantApplication.approvalStatus = Const.merchantApplicationStatusPendingPaypalReceived;
      user.merchantApplicationStatus = Const.merchantApplicationStatusPendingPaypalReceived;

      const savedApplication = await merchantApplication.save();
      await user.save();

      Base.successResponse(response, Const.responsecodeSucceed, {
        updatedMerchantApplication: savedApplication.toObject(),
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "MerchantApplicationController - confirm paypal email",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/merchant-applications/update/ Update merchant application with paypal email
 * @apiVersion 2.2.2
 * @apiName Update merchant application with paypal email
 * @apiGroup WebAPI Merchant application
 * @apiDescription API for updating merchant application with user's paypal email.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} paypalEmail User's Paypal email address
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636552623882,
 *   "data": {
 *     "updatedMerchantApplication": {
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
 *       "approvalComment": "This is a comment!",
 *       "created": 1636552623842,
 *       "_id": "618bcfaf0c3de3a97fcc16a8",
 *       "userId": "5f7ee464a283bc433d9d722f",
 *       "username": "mdragic",
 *       "phoneNumber": "+2348020000007",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "dateOfBirth": "5153477845",
 *       "streetName": "Street",
 *       "streetNumber": "2",
 *       "city": "Tokyo",
 *       "zip": "55555",
 *       "paypalEmail": "mdragic@gmail.com",
 *       "paypalAmountSent": null,
 *       "paypalAmountReceived": null,
 *       "taxIN": 1111,
 *       "bankName": "Bank of Japan",
 *       "bankCountry": "Japan",
 *       "bankAccountNumber": "555555555",
 *       "routingNumber": 232432,
 *       "merchantCode": "17568392"
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
 * @apiError (Errors) 443429 Merchant application of user not found
 * @apiError (Errors) 443432 No paypalEmail parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000760 User not found
 */

router.patch("/update", auth({ allowUser: true }), async function (request, response) {
  try {
    const token = request.headers["access-token"];
    const { paypalEmail } = request.body;

    if (!paypalEmail) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodePaypalEmailNotFound,
        message: `MerchantApplicationController - update application with paypal email, no paypalEmail parameter`,
      });
    }

    const user = await User.findOne({ "token.token": token });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `MerchantApplicationController - update application with paypal email, user not found`,
      });
    }

    const merchantApplication = await MerchantApplication.findOne({
      userId: user._id.toString(),
      approvalStatus: {
        $in: [
          Const.merchantApplicationStatusPending,
          Const.merchantApplicationStatusApprovedWithoutPayout,
        ],
      },
    });
    if (!merchantApplication) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMerchantApplicationNotFound,
        message: `MerchantApplicationController - update application with paypal email, merchant application not found`,
      });
    }

    merchantApplication.paypalEmail = paypalEmail;
    merchantApplication.approvalStatus = Const.merchantApplicationStatusPendingPaypalEmailAdded;
    user.merchantApplicationStatus = Const.merchantApplicationStatusPendingPaypalEmailAdded;

    const savedApplication = await merchantApplication.save();
    await user.save();

    Base.successResponse(response, Const.responsecodeSucceed, {
      updatedMerchantApplication: savedApplication.toObject(),
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MerchantApplicationController - update application with paypal email",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/merchant-applications/:applicationId Update merchant application status
 * @apiVersion 2.0.9
 * @apiName Update merchant application status
 * @apiGroup WebAPI Merchant application
 * @apiDescription API for updating merchant application approvalStatus and adding approvalComment. Access allowed only for admin page.
 * User needs at least admin role.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {Number} approvalStatus Approval status of the application (2 - rejected, 3 - approved without payout, 6 - approved with payout)
 * @apiParam {String} [approvalComment] Approval comment. To delete comment send empty string
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636552623882,
 *   "data": {
 *     "merchantApplication": {
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
 *       "approvalComment": "This is a comment!",
 *       "created": 1636552623842,
 *       "_id": "618bcfaf0c3de3a97fcc16a8",
 *       "userId": "5f7ee464a283bc433d9d722f",
 *       "username": "mdragic",
 *       "phoneNumber": "+2348020000007",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "dateOfBirth": "5153477845",
 *       "streetName": "Street",
 *       "streetNumber": "2",
 *       "city": "Tokyo",
 *       "zip": "55555",
 *       "paypalEmail": "mdragic@gmail.com",
 *       "paypalAmountSent": 1.44, (if not initialized value is null, or without this key)
 *       "paypalAmountReceived": 1.44, (if not initialized value is null, or without this key)
 *       "taxIN": 1111,
 *       "bankName": "Bank of Japan",
 *       "bankCountry": "Japan",
 *       "bankAccountNumber": "555555555",
 *       "routingNumber": 232432,
 *       "merchantCode": "17568392"
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Push notification
 * {
 *   "pushType": 760,
 *   "info": {
 *     "title": "Merchant application approved",
 *     "text": "Congrats!",
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
 * @apiError (Errors) 443429 Pending merchant application with applicationId not found
 * @apiError (Errors) 443430 Invalid approval status
 * @apiError (Errors) 443438 Paypal email not confirmed
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
          message: `MerchantApplicationController - update status, applicationId is not a valid id`,
        });
      }

      const merchantApplication = await MerchantApplication.findOne({ _id: applicationId });
      if (!merchantApplication) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeMerchantApplicationNotFound,
          message: `MerchantApplicationController - update status, merchant application not found`,
        });
      }
      if ([2, 3, 6].indexOf(approvalStatus) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidApprovalStatus,
          message: `MerchantApplicationController - update status, invalid approvalStatus`,
        });
      }

      const user = await User.findOne({ _id: merchantApplication.userId });

      let bankInfoExists = false;

      if (!!merchantApplication.bankAccountNumber && !!merchantApplication.bankCode)
        bankInfoExists = true;

      if (
        approvalStatus === Const.merchantApplicationStatusApprovedWithPayout &&
        ((user.phoneNumber.startsWith("+234") && !bankInfoExists) ||
          (!user.phoneNumber.startsWith("+234") && !merchantApplication.paypalEmail))
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodePaypalEmailNotConfirmed,
          message: `MerchantApplicationController - update status, merchant application not confirmed, payout info missing`,
        });
      }

      merchantApplication.approvalStatus = approvalStatus;
      merchantApplication.approvalComment = approvalComment;
      await merchantApplication.save();

      const merchantApplicationObj = merchantApplication.toObject();
      delete merchantApplicationObj.__v;

      if (
        merchantApplicationObj.approvalStatus ===
          Const.merchantApplicationStatusApprovedWithoutPayout ||
        merchantApplicationObj.approvalStatus === Const.merchantApplicationStatusApprovedWithPayout
      ) {
        const newBankAccount = {
          merchantCode: merchantApplicationObj.merchantCode,
          bankName: merchantApplicationObj.bankName,
          accountNumber: merchantApplicationObj.bankAccountNumber,
          code: merchantApplicationObj.bankCode,
          selected: user?.bankAccounts?.length ? false : true,
        };

        user.bankAccounts.push(newBankAccount);
        user.markModified("bankAccounts");
        user.status = 1;
        user.typeAcc = Const.userTypeMerchant;
        const dateOfBirth = new Date(+merchantApplicationObj.dateOfBirth);
        user.merchantDOB =
          "" + dateOfBirth.getDate() + dateOfBirth.getMonth() + dateOfBirth.getFullYear();

        if (
          merchantApplicationObj.approvalStatus ===
          Const.merchantApplicationStatusApprovedWithPayout
        )
          user.paypalEmail = merchantApplication.paypalEmail;
      }

      user.merchantApplicationStatus = approvalStatus;
      await user.save();

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
        merchantApplicationId: applicationId,
      });

      Base.successResponse(response, Const.responsecodeSucceed, {
        merchantApplication: merchantApplicationObj,
      });

      if (Config.environment !== "production") return;

      // sending bonus payout to NG merchant
      try {
        if (approvalStatus === Const.merchantApplicationStatusApprovedWithPayout) {
          await sendBonus({
            userId: merchantApplication.userId,
            bonusType: Const.payoutForApprovedMerchantApplication,
          });
        }
      } catch (error) {
        logger.error("MerchantApplicationController - bonus payout", error);
      }
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "MerchantApplicationController - update status",
        error,
      });
    }
  },
);

async function handleImageFile(file) {
  try {
    //NOTE add file extension to the name when implementing to New Flom
    const tempPath = file.path;
    const fileName = file.name;
    const destPath = Config.idPhotosPath + "/";
    const newFileName = Utils.getRandomString(32);
    const fileData = {
      file: {
        originalName: fileName,
        nameOnServer: newFileName,
      },
    };

    await sharp(tempPath)
      .png()
      .toFile(destPath + newFileName);

    const newFile = await fsp.stat(destPath + newFileName);

    fileData.fileType = Const.fileTypeImage;
    fileData.file.size = newFile.size;
    fileData.file.mimeType = "image/png";

    return fileData;
  } catch (error) {
    logger.error("MerchantApplicationController, handleImageFile", error);
    throw new Error("Error in handleImageFile");
  }
}

async function sendPushNotifications({ pushTokens, approvalStatus, approvalComment }) {
  let title = "Merchant application ";
  if (
    approvalStatus === Const.merchantApplicationStatusApprovedWithoutPayout ||
    approvalStatus === Const.merchantApplicationStatusApprovedWithPayout
  ) {
    title += "approved";
  } else {
    title += "declined";
  }

  for (let i = 0; i < pushTokens.length; i++) {
    await Utils.callPushService({
      pushToken: pushTokens[i],
      isVoip: false,
      unreadCount: 1,
      isMuted: false,
      payload: {
        pushType: Const.pushTypeMerchantApplication,
        info: {
          title,
          text: approvalComment,
        },
      },
    });
  }

  return;
}

async function sendNotifications({
  userId,
  approvalStatus,
  approvalComment,
  merchantApplicationId,
}) {
  let title = "Merchant application ";
  let status = 0;
  if (
    approvalStatus === Const.merchantApplicationStatusApprovedWithoutPayout ||
    approvalStatus === Const.merchantApplicationStatusApprovedWithPayout
  ) {
    title += "approved";
    status = 1;
  } else {
    title += "declined";
    status = 2;
  }

  await Notification.create({
    title,
    text: approvalComment,
    receiverIds: [userId],
    senderId: Config.flomSupportAgentId,
    referenceId: merchantApplicationId,
    notificationType: Const.notificationTypeMerchantApplication,
    status,
  });
  await User.updateOne({ _id: userId }, { $inc: { "notifications.unreadCount": 1 } });

  return;
}

module.exports = router;
