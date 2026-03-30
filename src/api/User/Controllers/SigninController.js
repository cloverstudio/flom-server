"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, Organization, OrganizationSettings } = require("#models");
const { updateUsersPushToken } = require("#logics");

/**
      * @api {post} /api/v2/user/signin Signin
      * @apiName Signin
      * @apiGroup WebAPI
      * @apiDescription Returns new token for the user.
      *   
      * @apiParam {String} organizationid organizationid 
      * @apiParam {String} userid userid 
      * @apiParam {String} password hashed password
      * @apiParam {String} pushToken pushToken for push notification service
      * @apiParam {String} secret secret
      * @apiParam {String} UUID UUID
      * 
      * @apiSuccessExample Success-Response:
 {
     code: 1,
     time: 1454417582385,
     data: {
         newToken: 'DOqsolWe6zt3EFn0',
         user: {
             _id: '56b0a6ae6753ea416ad58ea9',
             name: 'user1',
             userid: 'userid1ixfQJ',
             password: '*****',
             created: 1454417582354,
             __v: 0,
             token: '*****',
             tokenGeneratedAt: 1454417582384
         },
         organization: {
             _id: '56b0a6ae6753ea416ad58ea8',
             organizationId: 'clover',
             name: 'user1',
             created: 1454417582336,
             status: 1,
             __v: 0
         }
     }
 }
 
     */

router.post("/", async function (request, response) {
  try {
    if (!request.body.organizationid) {
      return Base.successResponse(response, Const.responsecodeSigninNoOrganizationid);
    }

    if (!request.body.userid) {
      return Base.successResponse(response, Const.responsecodeSigninNoUserid);
    }

    if (!request.body.password) {
      return Base.successResponse(response, Const.responsecodeSigninNoPassword);
    }

    /* if (!request.body.secret) {
            return Base.successResponse(response, Const.responsecodeSigninWrongSecret);
        } */

    const organizationid = request.body.organizationid;
    const userid = request.body.userid;
    const password = request.body.password;
    const secret = request.body.secret;
    const UUID = request.body.UUID;

    // check secret first
    const tenSec = Math.floor(Utils.now() / 1000 / 10);
    const salt = Config.hashSalt;
    const candidate1 = salt + tenSec;
    const candidate2 = salt + (tenSec - 1);
    const candidate3 = salt + (tenSec - 2);

    function sha1(text) {
      return crypto.createHash("sha1").update(text).digest("hex");
    }

    if (!(sha1(candidate1) == secret || sha1(candidate2) == secret || sha1(candidate3) == secret)) {
      if (secret != Config.signinBackDoorSecret) {
        return Base.successResponse(response, Const.responsecodeSigninWrongSecret);
      }
    }

    // simple validation passed

    const organization = await Organization.findOne({ organizationId: organizationid }).lean();

    if (!organization) {
      return Base.successResponse(response, Const.responsecodeSigninWrongOrganizationId);
    }

    const user = await User.findOne({
      organizationId: organization._id.toString(),
      userid,
      status: 1,
      password,
    }).lean();

    if (!user) {
      return Base.successResponse(response, Const.responsecodeSigninWrongUserCredentials);
    }

    const uuidAry = user.UUID || [];
    const UUIDSaved = uuidAry.filter((uuidObj) => uuidObj.UUID == UUID);

    if (UUIDSaved.length > 0 && UUIDSaved[0].blocked) {
      return Base.successResponse(response, Const.responsecodeDeviceRejected);
    }

    const organizationSettings = await OrganizationSettings.findOne({
      organizationId: organization._id.toString(),
    }).lean();

    if (
      organizationSettings &&
      organizationSettings.allowMultipleDevice === 0 &&
      UUID &&
      UUIDSaved.length > 0 &&
      UUIDSaved[0].UUID != UUID
    ) {
      return Base.successResponse(response, Const.responsecodeUserBlocked);
    }

    const newToken = Utils.getRandomString(Const.tokenLength);
    const now = Date.now();

    const tokenObj = {
      token: newToken,
      generateAt: now,
    };

    let tokenAry = user.token || [];

    tokenAry.push(tokenObj);

    // cleanup expired tokens
    tokenAry = tokenAry.filter((row) => row.generateAt + Const.tokenValidInterval > now);

    let updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { token: tokenAry },
      { new: true, lean: true },
    );

    const newPushToken = request.body.pushToken;
    if (newPushToken) {
      await updateUsersPushToken(newPushToken, user._id.toString(), false);

      if (!updatedUser.pushToken.includes(newPushToken)) {
        updatedUser.pushToken.push(newPushToken);
      }
    }

    const newVoipPushToken = request.body.voipPushToken;
    if (newVoipPushToken) {
      await updateUsersPushToken(newVoipPushToken, user._id.toString(), true);

      if (!updatedUser.voipPushToken.includes(newVoipPushToken)) {
        updatedUser.voipPushToken.push(newVoipPushToken);
      }
    }

    let savedUUIDs = updatedUser.UUID || [];
    let changed = false;

    if (UUID) {
      savedUUIDs.forEach((o) => {
        if (o.UUID == UUID) {
          o.lastLogin = Date.now();
          o.lastToken = newToken;

          if (!o.pushTokens) o.pushTokens = [];

          if (newPushToken && o.pushTokens.indexOf(newPushToken) == -1)
            o.pushTokens.push(newPushToken);

          if (newVoipPushToken && o.pushTokens.indexOf(newVoipPushToken) == -1)
            o.pushTokens.push(newVoipPushToken);

          changed = true;
        }
      });
    }

    if (changed) {
      updatedUser = await User.findByIdAndUpdate(
        user._id.toString(),
        { UUID: savedUUIDs },
        { new: true, lean: true },
      );
    }

    const responseData = {
      newToken,
      user: updatedUser,
      organization,
    };

    return Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "SigninController, USER", error);
  }
});

/**
      * @api {post} /api/v2/user/signin/guest Guest Signin
      * @apiName  Guest Signin
      * @apiGroup WebAPI
      * @apiDescription Returns new token for guest user.
      *   
      * @apiParam {String} organizationid organizationid 
      * @apiParam {String} userid userid 
      * @apiParam {String} pushToken pushToken for push notification service
      * @apiParam {String} voipPushToken pushToken for push notification service
      * @apiParam {String} secret secret
      * 
      * @apiSuccessExample Success-Response:
    {
     code: 1,
     time: 1454417582385,
     data: {
         newToken: 'DOqsolWe6zt3EFn0',
         user: {
             _id: '56b0a6ae6753ea416ad58ea9',
             name: 'user1',
             userid: 'userid1ixfQJ',
             password: '*****',
             created: 1454417582354,
             __v: 0,
             token: '*****',
             tokenGeneratedAt: 1454417582384
         },
         organization: {
             _id: '56b0a6ae6753ea416ad58ea8',
             organizationId: 'clover',
             name: 'user1',
             created: 1454417582336,
             status: 1,
             __v: 0
         }
     }
    }
     
     */

router.post("/guest", async function (request, response) {
  try {
    if (!request.body.organizationid) {
      return Base.successResponse(response, Const.responsecodeSigninNoOrganizationid);
    }

    if (!request.body.userid) {
      return Base.successResponse(response, Const.responsecodeSigninNoUserid);
    }

    if (!request.body.secret) {
      return Base.successResponse(response, Const.responsecodeSigninWrongSecret);
    }

    const organizationid = request.body.organizationid;
    const userid = request.body.userid;
    const secret = request.body.secret;

    // check secret first
    const tenSec = Math.floor(Utils.now() / 1000 / 10);
    const salt = Config.hashSalt;
    const candidate1 = salt + tenSec;
    const candidate2 = salt + (tenSec - 1);
    const candidate3 = salt + (tenSec - 2);

    function sha1(text) {
      return crypto.createHash("sha1").update(text).digest("hex");
    }

    if (!(sha1(candidate1) == secret || sha1(candidate2) == secret || sha1(candidate3) == secret)) {
      if (secret != Config.signinBackDoorSecret) {
        return Base.successResponse(response, Const.responsecodeSigninWrongSecret);
      }
    }

    // simple validation passed
    const organization = await Organization.findOne({ organizationId: organizationid }).lean();

    if (!organization) {
      return Base.successResponse(response, Const.responsecodeSigninWrongOrganizationId);
    }

    let user = await User.findOne({
      organizationId: organization._id.toString(),
      userid,
      isGuest: 1,
    }).lean();

    if (!user) {
      user = await User.create({
        name: "Guest User",
        userid,
        password: "",
        isGuest: 1,
        organizationId: organization._id.toString(),
        created: Date.now(),
        status: 1,
      });

      user = user.toObject();
    }

    const newToken = Utils.getRandomString(Const.tokenLength);
    const now = Date.now();

    const tokenObj = {
      token: newToken,
      generateAt: now,
    };

    let tokenAry = user.token || [];

    tokenAry.push(tokenObj);

    // cleanup expired tokens
    tokenAry = tokenAry.filter((row) => row.generateAt + Const.tokenValidInterval > now);

    await User.findByIdAndUpdate(user._id.toString(), { token: tokenAry });

    const newPushToken = request.body.pushToken;
    if (newPushToken) {
      await updateUsersPushToken(newPushToken, user._id.toString(), false);

      if (!user.pushToken.includes(newPushToken)) {
        user.pushToken.push(newPushToken);
      }
    }

    const newVoipPushToken = request.body.voipPushToken;
    if (newVoipPushToken) {
      await updateUsersPushToken(newVoipPushToken, user._id.toString(), true);

      if (!user.voipPushToken.includes(newVoipPushToken)) {
        user.voipPushToken.push(newVoipPushToken);
      }
    }

    const responseData = {
      newToken,
      user,
      organization,
    };

    return Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "SigninController, GUEST",
      error,
    );
  }
});

module.exports = router;
