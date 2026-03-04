"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { authorizeNet } = require("#services");

/**
 * @api {get} /api/v2/user/payment-methods User saved payment methods list
 * @apiVersion 2.0.5
 * @apiName User saved payment methods list
 * @apiGroup WebAPI User
 * @apiDescription API getting all users saved payment methods
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1610621939617,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "savedUserPaymentMethods": [
 *       {
 *         "paymentMethodId": "1841446059",
 *         "creditCardName": "American Express",
 *         "creditCardNumber": "0002",
 *         "displayName": "ending with 0002",
 *         "expirationDate": "08/2023",
 *         "expired": false,
 *         "firstName": "First",
 *         "lastName": "Last"
 *       },
 *       {
 *         "paymentMethodId": "1841445401",
 *         "creditCardName": "MasterCard",
 *         "creditCardNumber": "0015",
 *         "displayName": "ending with 0015",
 *         "expirationDate": "08/2020"
 *         "expired": true
 *       }
 *     ]
 *   }
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    let savedUserPaymentMethods = [];
    if (user.paymentProfileId) {
      savedUserPaymentMethods = await authorizeNet.getSavedPaymentMethods(user.paymentProfileId);

      savedUserPaymentMethods = savedUserPaymentMethods.map((paymentMethod) =>
        formatSavedPaymentMethod(paymentMethod),
      );
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      savedUserPaymentMethods,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSavedPaymentMethodsController list methods",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/user/payment-methods/:paymentMethodId User saved payment method
 * @apiVersion 2.0.5
 * @apiName User saved payment method
 * @apiGroup WebAPI User
 * @apiDescription API getting users saved payment method with paymentMethodId
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1610621939617,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "savedUserPaymentMethod": {
 *       "paymentMethodId": "1841446059",
 *       "creditCardName": "American Express",
 *       "creditCardNumber": "0002",
 *       "displayName": "ending with 0002",
 *       "expirationDate": "08/2023",
 *       "expired": false,
 *       "firstName": "First",
 *       "lastName": "Last"
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443108 User has no saved payment methods
 * @apiError (Errors) 443109 Payment method with paymentMethodId not found
 * @apiError (Errors) 4000007 Token not valid
 */
router.get("/:paymentMethodId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { paymentMethodId } = request.params;

    if (user.paymentProfileId) {
      const savedUserPaymentMethods = await authorizeNet.getSavedPaymentMethods(
        user.paymentProfileId,
      );
      if (savedUserPaymentMethods.length) {
        let savedUserPaymentMethod;
        savedUserPaymentMethods.forEach((paymentMethod) => {
          if (paymentMethodId === paymentMethod.customerPaymentProfileId) {
            savedUserPaymentMethod = formatSavedPaymentMethod(paymentMethod);
            return;
          }
        });
        if (savedUserPaymentMethod) {
          return Base.successResponse(response, Const.responsecodeSucceed, {
            savedUserPaymentMethod,
          });
        }
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSavedPaymentMethodNotFound,
          message: "UserSavedPaymentMethod, savedPaymentMethod not found",
        });
      }
    }

    Base.newErrorResponse({
      response,
      code: Const.responsecodeNoSavedPaymentMethods,
      message: "UserSavedPaymentMethod, no savedPaymentMethods",
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSavedPaymentMethodsController get method",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/user/payment-methods Save user payment method
 * @apiVersion 2.0.5
 * @apiName Save user payment method
 * @apiGroup WebAPI User
 * @apiDescription API for saving users payment method (credit card).
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String{13..16}} cardNumber      Credit card number (13-16 digit number)
 * @apiParam {String{4}}      expirationDate  Expiration date of the credit card. Has to be 4 numbers in format MMYY
 * @apiParam {String{3..4}}   cardCode        The 3 or 4 digit card code
 * @apiParam {String}         [firstName]     First name on the credit card
 * @apiParam {String}         [lastName]      Last name on the credit card
 * @apiParam {String}         address         Address of the user of the credit card
 * @apiParam {String}         zip Zip         code of the address for the credit card
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1610621939617,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "savedUserPaymentMethod": {
 *       "paymentMethodId": "1841446059",
 *       "creditCardName": "American Express",
 *       "creditCardNumber": "0002",
 *       "displayName": "ending with 0002",
 *       "expirationDate": "08/2023",
 *       "expired": false,
 *       "firstName": "First",
 *       "lastName": "Last"
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
 * @apiError (Errors) 443082 No cardNumber parameter in the request
 * @apiError (Errors) 443083 cardNumber incorrect length
 * @apiError (Errors) 443084 cardNumber is incorrect
 * @apiError (Errors) 443085 No expirationDate parameter in the request
 * @apiError (Errors) 443086 expirationDate incorrect length
 * @apiError (Errors) 443087 expirationDate is incorrect
 * @apiError (Errors) 443088 No cardCode parameter in the request
 * @apiError (Errors) 443089 cardCode incorrect length
 * @apiError (Errors) 443090 cardCode is incorrect
 * @apiError (Errors) 443102 No address parameter
 * @apiError (Errors) 443103 No zip parameter
 * @apiError (Errors) 443110 Authorize.net error when creating creating customer profile or payment method
 * @apiError (Errors) 443123 Credit card country and IP country do not match
 * @apiError (Errors) 443493 VPN
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { cardNumber, expirationDate, cardCode, firstName, lastName, address, zip } =
      request.body;
    const { user } = request;
    const { paymentProfileId } = user;

    const responseCode = validateCreditCardData({
      cardNumber,
      expirationDate,
      cardCode,
      firstName,
      lastName,
      address,
      zip,
    });
    if (responseCode !== 1) {
      return Base.newErrorResponse({
        response,
        code: responseCode,
        message: "UserSavedPaymentMethod, validateCreditCardData",
      });
    }

    const userIP = request.headers["x-forwarded-for"] || request.connection.remoteAddress;

    const countryFromIP = await Utils.getCountryFromIpAddress({ IP: userIP });
    console.log(`Save user payment method from ${userIP} in ${countryFromIP.countryCode}`);

    const countryCode = await Utils.countryFromBinNumber(cardNumber.substring(0, 9));
    console.log(`Save user payment method with credit card from ${countryCode}`);

    const countryFromPhoneNumber = Utils.getCountryCodeFromPhoneNumber({
      phoneNumber: user.phoneNumber,
    });

    if (Config.environment !== "development") {
      if (countryFromIP.isVPN) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeVPN,
          message: "UserSavedPaymentMethod, VPN",
        });
      }

      if (countryCode && countryCode !== countryFromPhoneNumber) {
        return Base.newErrorResponse({
          response,
          code: Const.responseCodeCountryDoesNotMatchPhoneCountry,
          message:
            "UserSavedPaymentMethod, Credit card country and phonenumber country do not match",
        });
      }
    }

    try {
      if (paymentProfileId) {
        await authorizeNet.addPaymentMethod({
          cardNumber,
          expirationDate,
          cardCode,
          firstName,
          lastName,
          address,
          zip,
          countryCode,
          paymentProfileId,
        });
      } else {
        const responseData = await authorizeNet.createPaymentProfile({
          userId: user._id.toString(),
          cardNumber,
          expirationDate,
          cardCode,
          firstName,
          lastName,
          address,
          zip,
          countryCode,
        });

        if (responseData.paymentProfileId) {
          user.paymentProfileId = responseData.paymentProfileId;
          await user.save();
        } else {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeFailedCreatingPaymentProfile,
            message: "UserSavedPaymentMethod, creating payment profile failed",
          });
        }
      }
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeFailedCreatingPaymentProfile,
        message: "UserSavedPaymentMethod, Add payment method error",
      });
    }

    const savedUserPaymentMethods = await authorizeNet.getSavedPaymentMethods(
      user.paymentProfileId,
    );
    const savedUserPaymentMethod = formatSavedPaymentMethod(savedUserPaymentMethods[0]);
    Base.successResponse(response, Const.responsecodeSucceed, {
      savedUserPaymentMethod,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSavedPaymentMethodsController add new payment method",
      error,
    });
  }
});

/**
 * @api {delete} /api/v2/user/payment-methods/:paymentMethodId Delete users saved payment method
 * @apiVersion 2.0.5
 * @apiName Delete users saved payment method
 * @apiGroup WebAPI User
 * @apiDescription API for deleting users saved payment method with paymentMethodId. Returns array of saved payment methods
 * that user still has.
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1610621939617,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "savedUserPaymentMethods": [
 *       {
 *         "paymentMethodId": "1841782552",
 *         "creditCardName": "MasterCard",
 *         "creditCardNumber": "9703",
 *         "displayName": "ending with 9703",
 *         "expirationDate": "03/2026",
 *         "expired": false
 *       },
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443108 User has no saved payment methods
 * @apiError (Errors) 443109 Payment method with paymentMethodId not found
 * @apiError (Errors) 443111 Authorize.net error when trying to delete saved payment method
 * @apiError (Errors) 443505 Can't delete because payment method used for recurring payment
 * @apiError (Errors) 4000007 Token not valid
 */

router.delete("/:paymentMethodId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { paymentMethodId } = request.params;

    if (user.paymentProfileId) {
      let savedUserPaymentMethods = await authorizeNet.getSavedPaymentMethods(
        user.paymentProfileId,
      );
      if (savedUserPaymentMethods.length) {
        let savedUserPaymentMethodFound = false;
        for (let i = 0; i < savedUserPaymentMethods.length; i++) {
          if (paymentMethodId === savedUserPaymentMethods[i].customerPaymentProfileId) {
            savedUserPaymentMethodFound = true;
            savedUserPaymentMethods.splice(0, 1);
            break;
          }
        }

        if (savedUserPaymentMethodFound) {
          try {
            await authorizeNet.deleteSavedPaymentMethod({
              paymentProfileId: user.paymentProfileId,
              paymentMethodId,
            });
            return Base.successResponse(response, Const.responsecodeSucceed, {
              savedUserPaymentMethods: savedUserPaymentMethods.map((paymentMethod) =>
                formatSavedPaymentMethod(paymentMethod),
              ),
            });
          } catch (error) {
            if (error.code === "E00105") {
              return Base.newErrorResponse({
                response,
                code: Const.responsecodeCantDeleteBecauseRecurringPayment,
                message: "UserSavedPaymentMethod, payment method in use for recurring payment",
              });
            }
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeFailedDeletingPaymentProfile,
              message: "UserSavedPaymentMethod, authorize.net delete saved payment method",
            });
          }
        }

        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSavedPaymentMethodNotFound,
          message: "UserSavedPaymentMethod, savedPaymentMethod not found",
        });
      }
    }

    Base.newErrorResponse({
      response,
      code: Const.responsecodeNoSavedPaymentMethods,
      message: "UserSavedPaymentMethod, no savedPaymentMethod",
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSavedPaymentMethodsController delete saved payment method",
      error,
    });
  }
});

function formatSavedPaymentMethod(paymentMethod) {
  const result = { paymentMethodId: paymentMethod.customerPaymentProfileId };

  let creditCardName = paymentMethod.payment.creditCard.cardType;
  if (creditCardName !== "MasterCard" && creditCardName !== "JCB") {
    creditCardName = creditCardName.replace(/([A-Z])/g, " $1").trim();
  }
  result.creditCardName = creditCardName;

  result.creditCardNumber = paymentMethod.payment.creditCard.cardNumber.replace("XXXX", "");

  result.displayName = "ending with " + result.creditCardNumber;

  const logoFileName = Const.cardLogoPaths[creditCardName.toLowerCase()] || Const.defaultCardLogo;
  result.logoUrl = `${Config.webClientUrl}/api/v2/payment-methods/get-logo/${logoFileName}`;

  const expirationDate = paymentMethod.payment.creditCard.expirationDate;
  const expirationDateArray = expirationDate.split("-");
  result.expirationDate = `${expirationDateArray[1]}/${expirationDateArray[0]}`;

  const currentDate = new Date().toJSON().slice(0, 7);
  result.expired = false;
  if (Date.parse(currentDate) > Date.parse(expirationDate)) {
    result.expired = true;
  }

  if (paymentMethod?.billTo?.firstName) {
    result.firstName = paymentMethod.billTo.firstName;
  }
  if (paymentMethod?.billTo?.lastName) {
    result.lastName = paymentMethod.billTo.lastName;
  }

  return result;
}

function validateCreditCardData({
  cardNumber,
  expirationDate,
  cardCode,
  firstName,
  lastName,
  address,
  zip,
}) {
  const numberRegex = /^\d+$/;
  if (!cardNumber) {
    return Const.responsecodeNoCardNumber;
  }
  if (cardNumber.length < 13 || cardNumber.length > 16) {
    return Const.responsecodeBuyCardNumberLength;
  }
  if (!numberRegex.test(cardNumber)) {
    return Const.responsecodeBuyCreditCardIncorrect;
  }

  if (!expirationDate) {
    return Const.responsecodeBuyNoExpirationDate;
  }
  if (expirationDate.length !== 4) {
    return Const.responsecodeBuyExpirationDateLength;
  }
  if (!numberRegex.test(expirationDate)) {
    return Const.responsecodeBuyExpirationDateIncorrect;
  }

  if (!cardCode) {
    return Const.responsecodeBuyNoCardCode;
  }
  if (cardCode.length !== 3 && cardCode.length !== 4) {
    return Const.responsecodeBuyCardCodeLength;
  }
  if (!numberRegex.test(cardCode)) {
    return Const.responsecodeBuyCardCodeIncorrect;
  }

  /* if (!firstName) {
      return Const.responsecodeNoFirstName;
    }
    if (!lastName) {
      return Const.responsecodeNoLastName;
    } */
  if (!address) {
    return Const.responsecodeNoAddress;
  }
  if (!zip) {
    return Const.responsecodeNoZip;
  }
  return 1;
}

module.exports = router;
