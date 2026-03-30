"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User } = require("#models");
const { getMerchantsPhoneNumber, createNewUser } = require("#logics");

/**
      * @api {get} /api/v2/user/merchant-code Get user by merchant code
      * @apiName  Get user by merchant code
      * @apiGroup WebAPI User
      * @apiDescription  Get user by merchant code
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam [String] merchantCode merchantCode
      * 
      * @apiSuccessExample Success-Response:
        {
    			"code": 1,
    			"time": 1588069972101,
    			"data": {
							"_id": "5caf6335e9ad4e2e953cb287",
							"token": [
									{
											"token": "*****",
											"generateAt": 1588616811963,
											"isWebClient": false
									}
							],
					````...
							],
							"merchantDOB": "06051992",
							"permission": 2,
							"userName": "toyosi",
							"invitationUri": "https://flom.page.link/cuHQhwCqxxW1d8vt9",
							"flomSupportAgentId": null,
							"createdBusinessInFlom": true
					}
				}
    **/

router.get("/:code", auth({ allowUser: true }), async (req, res) => {
  if (!req.params.code) {
    return Base.successResponse(res, Const.responsecodeNoMerchantCode);
  }

  const merchantCode = req.params.code;
  const phoneNumber = await getMerchantsPhoneNumber(merchantCode);

  const query = {
    ...(phoneNumber
      ? { $or: [{ "bankAccounts.merchantCode": merchantCode }, { phoneNumber }] }
      : { "bankAccounts.merchantCode": merchantCode }),
  };

  try {
    let user = await User.findOne(query).lean();

    if (user) {
      return Base.successResponse(res, Const.responsecodeSucceed, user);
    }

    if (phoneNumber) {
      user = await createNewUser({
        phoneNumber,
        typeAcc: Const.userTypeMerchant,
        isAppUser: false,
        ref: req.user._id.toString(),
        merchantCode,
      });
      return Base.successResponse(res, Const.responsecodeSucceed, user);
    } else {
      return Base.successResponse(res, Const.responsecodeSucceed, {});
    }
  } catch (error) {
    console.error("getUserByMerchantCodeController: ", error);
    return Base.errorResponse(res, Const.httpCodeServerError);
  }
});

module.exports = router;
