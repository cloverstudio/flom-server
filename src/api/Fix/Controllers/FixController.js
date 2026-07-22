"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const {
  User,
  FlomMessage,
  Test,
  NonFlomContact,
  Product,
  CoreIdentity,
  IdApplication,
  MerchantApplication,
} = require("#models");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { recombee } = require("#services");

router.get("/push", async function (request, response) {
  try {
    const { pt, pn, muted } = request.query;
    const mute = muted === "true";

    if (!pn) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPhoneNumber,
        message: "Push, invalid push type: " + pt,
      });
    }

    let phoneNumber = pn.trim();
    phoneNumber = phoneNumber.startsWith("+") ? phoneNumber : "+" + phoneNumber;
    const pushType = !pt ? null : +pt;

    if (!pushType || typeof pushType !== "number") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUnknownPushType,
        message: "Push, invalid push type: " + pt,
      });
    }

    const user = await User.findOne({ phoneNumber }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: "Push, user not found",
      });
    }

    const flomAgent = await User.findById(Config.flomSupportAgentId).lean();

    const message = `Test for push type: ${pushType}, isMuted: ${mute}`;

    await Logics.sendFlomPush({
      newUser: flomAgent,
      receiverUser: user,
      message: message,
      messageiOs: message,
      pushType,
      isMuted: mute,
    });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - Push",
      error,
    });
  }
});

router.get("/pushtest/:pushType", async (request, response) => {
  try {
    const pushType = +request.params.pushType;

    const user = await User.findOne({ phoneNumber: "+385958710207" }).lean();
    const sender = await User.findById(Config.flomSupportAgentId).lean();

    await Logics.sendFlomPush({
      newUser: sender,
      receiverUser: user,
      message: "message",
      messageiOs: "message iOs",
      pushType,
      isMuted: true,
    });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - pushtest",
      error,
    });
  }
});

router.post("/form", async (request, response) => {
  try {
    const { fields, files } = await Utils.formParse(request, {
      keepExtensions: true,
      uploadDir: Config.uploadPath,
    });

    console.log("Fields: ", fields);
    console.log("Files: ", files);

    Base.successResponse(response, Const.responsecodeSucceed, { fields, files });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - form",
      error,
    });
  }
});

router.get("/core-ids", async (request, response) => {
  Base.successResponse(response, Const.responsecodeSucceed, {});

  try {
    let offset = 0;
    const uuids = [];
    const phoneToUuidMap = {};

    const users = await User.find(
      { created: { $gt: offset } },
      {
        _id: 1,
        phoneNumber: 1,
        created: 1,
        isDeleted: 1,
        hasLoggedIn: 1,
        shadow: 1,
        deletedUserInfo: 1,
      },
    )
      .sort({ created: 1 })
      .lean();

    let ops = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const coreInfo = {
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        channel: "flom",
        created: user.created,
        isActive: true,
      };

      if (user.shadow || user.hasLoggedIn == 4) {
        coreInfo.channel = "shadow";
      }

      if (user.isDeleted?.value) {
        if (!user.deletedUserInfo?.phoneNumber) continue;

        coreInfo.isDeleted = true;
        coreInfo.deleted = user.isDeleted.created;
        coreInfo.isActive = false;
        coreInfo.phoneNumber = user.deletedUserInfo.phoneNumber;
      }

      let uuid = phoneToUuidMap[coreInfo.phoneNumber] || null;

      if (!uuid) {
        let isUnique = false;

        while (!isUnique) {
          uuid = crypto.randomUUID().toString();
          if (!uuids.includes(uuid)) {
            isUnique = true;
          }
        }
      }

      phoneToUuidMap[coreInfo.phoneNumber] = uuid;
      uuids.push(uuid);
      coreInfo.uuid = uuid;
      ops.push({ insertOne: { document: coreInfo } });

      if (ops.length >= 1000 || i === users.length - 1) {
        await CoreIdentity.bulkWrite(ops);

        logger.info(
          `Processed ${ops.length} users, last created processed: ${new Date(
            user.created,
          ).toISOString()}`,
        );

        ops = [];
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    logger.error("Error in /core-ids route:", error);
  }
});

router.get("/names", async (request, response) => {
  try {
    const idApps = await IdApplication.find({
      approvalStatus: Const.idApplicationStatusApproved,
    }).lean();

    const merchantApps = await MerchantApplication.find({
      approvalStatus: {
        $in: [
          Const.merchantApplicationStatusApprovedWithoutPayout,
          Const.merchantApplicationStatusApprovedWithPayout,
        ],
      },
    }).lean();

    const userMap = {};

    for (const app of merchantApps) {
      userMap[app.userId.toString()] = {
        firstName: app.firstName,
        lastName: app.lastName,
      };
    }

    for (const app of idApps) {
      if (!userMap[app.userId.toString()]) {
        userMap[app.userId.toString()] = {
          firstName: app.firstName,
          lastName: app.lastName,
        };
      }
    }

    const userIds = Array.from(new Set(Object.keys(userMap)));
    const ops = userIds.map((userId) => {
      let { firstName, lastName } = userMap[userId];

      return {
        updateOne: {
          filter: { _id: userId },
          update: { firstName, lastName },
        },
      };
    });

    if (ops.length > 0) {
      await User.bulkWrite(ops);
    }

    Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - form",
      error,
    });
  }
});

module.exports = router;
