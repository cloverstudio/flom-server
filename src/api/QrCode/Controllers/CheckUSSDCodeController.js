"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger, redis } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User } = require("#models");

/**
      * @api {post} /api/v2/qrcode/ussd/check check USSD code
      * @apiName check USSD code
      * @apiGroup WebAPI
      * @apiDescription check USSD code
			*   
      * @apiParam {String} code code
      * @apiParam {String} UUID UUID
      * @apiParam {String} pushToken pushToken
      * @apiParam {String} voipPushToken voipPushToken
      * @apiParam {String} ref ref - optional
      * 
      * @apiSuccessExample Success-Response:
 				{
					"code": 1,
					"time": 1588842967520,
					"data": {
							"merchantData": [], -> if empty user is not merchant (if yes than contains list user.bankAccounts)
							"user": {
									...whole user model...
							},
							"userData": {
									"userId": "5eb3d1c6b92cfc1844082c2a",
									"phoneNumber": "+385977774059",
									"tkn": "wAbVXL5ES5R7WtLh",
									"typeAcc": 2
							},
							"supportUser": {
									...whole user model...
							}
					}
			}
 **/

router.post("/", async function (request, response) {
  try {
    const IP = request.headers["x-forwarded-for"] || request.connection.remoteAddress;
    const { code, UUID, pushToken, voipPushToken, ref } = request.body;

    // IP Check
    logger.info(`CheckUSSDCodeController - ${UUID} - IP: ${IP}`);
    const ipAddressObj = await Utils.getCountryFromIpAddress({ IP });

    const value = await redis.get(Const.redisKeyQrCode + code);

    let userId = "";
    let dataToSend = {};

    if (value && value.userId) {
      userId = value.userId;
      await redis.del(Const.redisKeyQrCode + code);
    }

    if (userId && UUID) {
      let user = await User.findOne({ _id: userId, "isDeleted.value": false }).lean();

      if (user) {
        const updateData = {};

        const newToken = Utils.getRandomString(Const.tokenLength);
        const now = Utils.now();

        const tokenObj = {
          token: newToken,
          generateAt: now,
          isWebClient: false,
        };

        let tokenAry = user.token.filter((t) => t.isWebClient);

        tokenAry.push(tokenObj);

        const tokenToSend = tokenObj.token.toString();

        updateData.token = tokenAry;

        const uuidAry = [];
        const UUIDObj = {
          UUID: UUID,
          lastLogin: Utils.now(),
          blocked: false,
          lastToken: user.token,
          pushTokens: [],
        };

        if (pushToken) {
          UUIDObj.pushTokens.push(pushToken);
        }

        if (voipPushToken) {
          UUIDObj.pushTokens.push(voipPushToken);
        }

        uuidAry.push(UUIDObj);
        updateData.UUID = uuidAry;

        if (pushToken) {
          updateData.pushToken = [pushToken];
        }

        if (voipPushToken) {
          updateData.voipPushToken = [voipPushToken];
        }

        if (ref) {
          updateData.ref = ref;
        }

        if (value.otherDevice) {
          updateData.onAnotherDevice = true;
        } else {
          updateData.onAnotherDevice = false;
        }

        updateData.isCreator = user.typeAcc === 1 ? true : false;

        if (!user.deviceType) {
          updateData.deviceType = value.deviceType;
        }
        updateData.hasLoggedIn = Const.userLoggedInAtLeastOnce;
        updateData.lastLogin = Date.now();

        const { latitude, longitude } = ipAddressObj;
        const { location } = user;
        const { coordinates = null } = location || {};

        if ((!coordinates || !coordinates[0]) && latitude && longitude) {
          updateData.location = { type: "Point", coordinates: [longitude, latitude] };
        }

        let updatedUser = await User.findByIdAndUpdate(user._id.toString(), updateData, {
          new: true,
        });
        updatedUser = updatedUser.toObject();

        dataToSend.merchantData = updatedUser.typeAcc === 1 ? updatedUser.bankAccounts : [];
        dataToSend.user = updatedUser;

        dataToSend.userData = {
          userId,
          phoneNumber: user.phoneNumber,
          tkn: tokenToSend,
          typeAcc: user.typeAcc,
        };

        const supportUser = await User.findById(Config.flomSupportAgentId).lean();
        dataToSend.supportUser = supportUser;
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "CheckUSSDCodeController",
      error,
    );
  }
});

module.exports = router;
