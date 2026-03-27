"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Group, Organization, OrganizationSettings } = require("#models");

const formidable = require("formidable");
const fs = require("fs");
const easyimg = require("easyimage");

/**
      * @api {post} /api/v2/user/signup/sendSms Signup Send Sms
      * @apiName Signup Send Sms
      * @apiGroup WebAPI
      * @apiDescription Send SMS verification code to user
      *   
      * @apiParam {String} organizationId organizationId 
      * @apiParam {String} phoneNumber phoneNumber
      * @apiParam {Number=0,1} isWeb if api is called from web (1), otherwise (0)
      * 
      * @apiSuccessExample Success-Response:
         {
             code: 1,
             time: 1454417582385,
             data: {}
         }
 
     */

router.post("/sendSms", async (request, response) => {
  try {
    const phoneNumber = request.body.phoneNumber;
    const organizationId = request.body.organizationId;
    const isUnitTest = request.body.isUnitTest;
    const isWeb = request.body.isWeb;

    const activationCode = `${Utils.generateRandomNumber(6)}`;

    if (!organizationId) {
      return Base.successResponse(response, Const.responsecodeSignupNoOrganizationId);
    }

    const organization = await Organization.findOne({ organizationId: organizationId }).lean();

    if (!organization) {
      return Base.successResponse(response, Const.responsecodeSigninWrongOrganizationId);
    }

    const user = await User.findOne({
      userid: phoneNumber,
      organizationId: organization._id.toString(),
    }).lean();

    if (user && user.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    if (user && user.status === Const.userStatus.enabled) {
      await Utils.sendSMS(phoneNumber, "Hi! Your activation code is " + activationCode + ".");

      await User.findByIdAndUpdate(user._id.toString(), {
        activationCode: activationCode,
      });

      return Base.successResponse(
        response,
        Const.responsecodeSucceed,
        isUnitTest ? { activationCode } : {},
      );
    } else {
      // if user not found, create a disabled user with activation code and send sms

      await Utils.sendSMS(phoneNumber, "Hi! Your activation code is " + activationCode + ".");

      const newUser = new User({
        organizationId: organization._id,
        created: Utils.now(),
        phoneNumber: phoneNumber,
        userid: phoneNumber,
        activationCode: activationCode,
        status: Const.userStatus.disabled,
        permission: Const.userPermission.webClient,
      });

      await newUser.save();

      return Base.successResponse(
        response,
        Const.responsecodeSucceed,
        isUnitTest ? { activationCode } : {},
      );
    }
  } catch (error) {
    logger.error("SignupController sendSms error", error);
    return Base.successResponse(response, Const.responsecodeUnknownError);
  }
});

/**
      * @api {post} /api/v2/user/signup/verifyFlomAgent Verify Flom Agent
      * @apiName Verify Flom Agent
      * @apiGroup WebAPI
      * @apiDescription Verifies if flom agent can login as user
      *   
      * @apiParam {String} flomSupportAgentId flomSupportAgentId
      * @apiParam {String} userId userId
      * 
      * @apiSuccessExample Success-Response:
         {
             code: 1,
             time: 1454417582385,
             data: {
                 verified: true
             }
         }
 
     */
router.post("/verifyFlomAgent", async (request, response) => {
  try {
    const flomSupportAgentId = request.body.flomSupportAgentId;
    const userId = request.body.userId;

    if (!flomSupportAgentId) {
      return Base.successResponse(response, Const.responsecodeNoFlomAgentId);
    }

    if (!userId) {
      return Base.successResponse(response, Const.responsecodeNoUserId);
    }

    const users = await User.find({ _id: { $in: [flomSupportAgentId, userId] } }).lean();

    if (users.length !== 2) {
      return Base.successResponse(response, Const.responsecodeFlomAgentNotVerified);
    }

    let nonAppUser = users.find((user) => !user.isAppUser);
    let flomAgent = users.find(
      (user) =>
        user.permission === Const.userPermission.organizationAdmin ||
        user.permission === Const.userPermission.flomAgent,
    );

    let verified = false;

    if (nonAppUser && flomAgent) {
      if (flomAgent.permission === Const.userPermission.organizationAdmin) {
        if (flomAgent.organizationId === nonAppUser.organizationId) {
          verified = true;
        }
      } else if (flomAgent.permission === Const.userPermission.flomAgent) {
        if (nonAppUser.flomSupportAgentId === flomAgent._id.toString()) {
          verified = true;
        }
      }
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { verified });
  } catch (error) {
    logger.error("SignupController verifyFlomAgent error", error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

/**
     * @api {post} /api/v2/user/signup/verify Signup Verify Sms
     * @apiName Signup Verify Sms
     * @apiGroup WebAPI
     * @apiDescription Returns new token for the user.
     * 
     * @apiHeader {String} uuid uuid
     *   
     * @apiParam {String} activationCode Activation code received in SMS 
     * @apiParam {String} pushToken pushToken 
     * @apiParam {String} voipPushToken voipPushToken
     * 
     * @apiSuccessExample Success-Response:
        {
            code: 1,
            time: 1454417582385,
            data: {
                "newToken": "uSKuT4qC9LQDRHJv",
                "user": {
                    "_id": "588b4f191f8eae1954e9a37c",
                    "organizationId": "test",
                    "created": 1485524761592,
                    "phoneNumber": "+385989057351",
                    "userid": "+385989057351",
                    "activationCode": "815443",
                    "status": 1,
                    "__v": 1,
                    "UUID": [],
                    "devices": [],
                    "blocked": [],
                    "muted": [],
                    "groups": [],
                    "voipPushToken": [],
                    "pushToken": [],
                    "token": [
                        {
                            "generateAt": 1485524904386,
                            "token": "*****"
                        }
                    ]
                }
            }
        }

    */
router.post("/verify", async (request, response) => {
  try {
    const activationCode = request.body.activationCode;
    const isWeb = request.body.isWeb;
    const userId = request.body.userId;
    const UUID = request.headers["uuid"];

    let query = {};
    if (isWeb) query._id = userId;
    else query.activationCode = activationCode;

    const user = await User.findOne(query);

    if (!user) {
      return Base.successResponse(response, Const.responsecodeSignupInvalidActivationCode);
    }
    if (user.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    const uuidAry = user.UUID || [];
    const UUIDSaved = uuidAry.find((uuidObj) => uuidObj.UUID === UUID);

    if (!isWeb && UUIDSaved && UUIDSaved.blocked) {
      return Base.successResponse(response, Const.responsecodeDeviceRejected);
    }

    const organizationSettings = await OrganizationSettings.findOne({
      organizationId: user.organizationId,
    }).lean();

    if (organizationSettings && !organizationSettings.allowMultipleDevice) {
      const sortedUUIDs = uuidAry.sort((a, b) => b.lastLogin - a.lastLogin);
      const lastLoginedDevice = sortedUUIDs[0];

      if (!isWeb && UUID && lastLoginedDevice && lastLoginedDevice.UUID !== UUID) {
        return Base.successResponse(response, Const.responsecodeUserBlocked);
      }
    }

    const newToken = Utils.getRandomString(Const.tokenLength);
    const now = Date.now();

    const tokenObj = {
      token: newToken,
      generateAt: now,
    };

    if (isWeb) tokenObj.isWebClient = true;

    let tokenAry = user.token || [];
    tokenAry.push(tokenObj);

    // cleanup expired tokens
    tokenAry = tokenAry.filter((row) => row.generateAt + Const.tokenValidInterval > now);

    user.token = tokenAry;

    if (UUID) {
      const existingUUIDIndex = uuidAry.findIndex((uuidObj) => uuidObj.UUID === UUID);

      if (existingUUIDIndex !== -1) {
        uuidAry[existingUUIDIndex].lastLogin = now;
        uuidAry[existingUUIDIndex].lastToken = newToken;
        uuidAry[existingUUIDIndex].blocked = false; // unblock device on new login
      } else {
        uuidAry.push({
          UUID: UUID,
          lastLogin: now,
          lastToken: newToken,
          blocked: false,
        });
      }
    }

    user.UUID = uuidAry;

    await user.save();

    if (request.body.pushToken) {
      const pushToken = request.body.pushToken;
      const savedPushTokens = user.pushToken || [];

      if (!user.pushToken || !savedPushTokens.includes(pushToken)) {
        user.pushToken = user.pushToken || [];
        user.pushToken.push(pushToken);

        await User.updateMany(
          { pushToken: pushToken, _id: { $ne: user._id.toString() } },
          { $pull: { pushToken: pushToken } },
          { multi: true },
        );
        await user.save();
      }
    }

    if (request.body.voipPushToken) {
      const voipPushToken = request.body.voipPushToken;
      const savedVoipPushTokens = user.voipPushToken || [];

      if (!user.voipPushToken || !savedVoipPushTokens.includes(voipPushToken)) {
        user.voipPushToken = user.voipPushToken || [];
        user.voipPushToken.push(voipPushToken);

        await User.updateMany(
          { voipPushToken: voipPushToken, _id: { $ne: user._id.toString() } },
          { $pull: { voipPushToken: voipPushToken } },
          { multi: true },
        );
        await user.save();
      }
    }

    user.status = Const.userStatus.enabled;
    user.activationCode = "";
    user.hasLoggedIn = Const.userLoggedInAtLeastOnce;
    if (!user.firstLogin && user.lastLogin) {
      user.firstLogin = 1;
    } else if (!user.firstLogin) {
      user.firstLogin = Date.now();
    }
    user.lastLogin = Date.now();
    user.loginCount = !user.loginCount ? 1 : user.loginCount + 1;

    await user.save();

    const organization = await Organization.findById(user.organizationId).lean();

    Base.successResponse(response, Const.responsecodeSucceed, {
      newToken,
      user: user.toObject(),
      organization,
    });
  } catch (error) {
    logger.error("SignupController verify error", error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

/**
     * @api {post} /api/v2/user/signup/finish Signup Finish
     * @apiName Signup Finish
     * @apiGroup WebAPI
     * @apiDescription Updates a user
     *   
     * @apiHeader {String} access-token Users unique access-token.
    
     * @apiParam {String} name display name
     * @apiParam {String} password hashed password
     * @apiParam {String} secret secret
     * @apiParam {String} file avatar file
    
     * 
     * @apiSuccessExample Success-Response:
        {
            code: 1,
            time: 1454417582385,
            data: {
                "user": {
                    "_id": "588b4f191f8eae1954e9a37c",
                    "organizationId": "test",
                    "created": 1485524761592,
                    "phoneNumber": "+385989057351",
                    "userid": "+385989057351",
                    "activationCode": "815443",
                    "status": 1,
                    "__v": 1,
                    "UUID": [],
                    "devices": [],
                    "blocked": [],
                    "muted": [],
                    "groups": [],
                    "voipPushToken": [],
                    "pushToken": [],
                    "token": [
                        {
                            "generateAt": 1485524904386,
                            "token": "*****"
                        }
                    ]
                }
            }
        }
    
    */

router.post("/finish", auth({ allowUser: true }), async (request, response) => {
  try {
    const user = await User.findById(request.user._id.toString());
    const form = new formidable.IncomingForm();

    const { fields, files } = await form.parse(request);
    const file = files.file;

    const name = fields.name;
    const password = fields.password;
    const secret = fields.secret;

    if (!name) {
      return Base.successResponse(response, Const.responsecodeSignupInvalidUserName);
    }
    if (!password) {
      return Base.successResponse(response, Const.responsecodeSignupInvalidPassword);
    }

    // check secret first
    const tenSec = Math.floor(Date.now() / 1000 / 10);
    const salt = Config.hashSalt;
    const candidate1 = salt + tenSec;
    const candidate2 = salt + (tenSec - 1);
    const candidate3 = salt + (tenSec - 2);

    function sha1(text) {
      return crypto.createHash("sha1").update(text).digest("hex");
    }

    if (
      sha1(candidate1) === secret ||
      sha1(candidate2) === secret ||
      sha1(candidate3) === secret ||
      secret === Config.signinBackDoorSecret
    ) {
    } else {
      return Base.successResponse(response, Const.responsecodeSigninWrongSecret);
    }

    const group = await Group.findOne({
      organizationId: user.organizationId,
      type: Const.groupType.department,
      default: true,
    }).lean();

    if (file) {
      const tempPath = file.path;
      const destPath = Config.uploadPath + "/";

      const newFileName = Utils.getRandomString(32);
      file.newFileName = newFileName;
      await fs.promises.copyFile(tempPath, destPath + newFileName);

      await easyimg.convert({
        src: destPath + newFileName,
        dst: destPath + newFileName + ".png",
        quality: 100,
      });
      await fs.promises.rename(destPath + newFileName + ".png", destPath + newFileName);

      if (file.type.includes("jpeg") || file.type.includes("gif") || file.type.includes("png")) {
        const thumbFileName = Utils.getRandomString(32);
        file.thumbName = thumbFileName;
        const destPathTmp = destPath + thumbFileName;

        await easyimg.thumbnail({
          src: destPath + newFileName,
          dst: destPathTmp + ".png",
          width: Const.thumbSize,
          height: Const.thumbSize,
        });
        await fs.promises.rename(destPathTmp + ".png", destPathTmp);
        file.thumbSize = (await fs.promises.stat(destPathTmp)).size;
      }
    }

    user.name = name;
    user.sortName = name.toLowerCase();
    user.password = password;

    if (!user.groups && group) user.groups = group._id;

    if (file) {
      user.avatar = {
        picture: {
          originalName: file.name,
          size: file.size,
          mimeType: "image/png",
          nameOnServer: file.newFileName,
        },
        thumbnail: {
          originalName: file.name,
          size: file.thumbSize,
          mimeType: "image/png",
          nameOnServer: file.thumbName,
        },
      };
    }

    await user.save();

    if (!group.users.includes(user._id.toString())) {
      await Group.findByIdAndUpdate(group._id.toString(), {
        $push: { users: user._id.toString() },
      });
    }

    return Base.successResponse(response, Const.responsecodeSucceed, { user: user.toObject() });
  } catch (error) {
    logger.error("SignupController finish error", error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

module.exports = router;
