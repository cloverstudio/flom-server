"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, FlomMessage, Test, NonFlomContact, Product, CoreIdentity } = require("#models");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { recombee } = require("#services");

router.get("/env", async (request, response) => {
  try {
    if (Config.environment === "production") {
      return Base.successResponse(response, Const.responsecodeSucceed, {});
    }

    Base.successResponse(response, Const.responsecodeSucceed, { env: process.env });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - env",
      error,
    });
  }
});

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

router.get("/test-gpt", async (request, response) => {
  try {
    const { text } = request.query;

    const result = await Logics.callChatGPTApi(text, "0", "0", false);

    Base.successResponse(response, Const.responsecodeSucceed, { result });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - test-gpt",
      error,
    });
  }
});

router.get("/flom-team-data", async (request, response) => {
  try {
    const twoWeeksAgo = Math.floor(new Date().getTime() / 1000) - 14 * 24 * 60 * 60;

    const messages = await FlomMessage.aggregate(
      [
        {
          $match: {
            roomID: {
              $regex:
                Config.environment !== "production"
                  ? "5e08f8029d384b04a30b23aa"
                  : "600c62808a3b6641b0036f3f",
              $options: "i",
            }, // Case insensitive search
            created: { $gte: twoWeeksAgo }, // Messages from the last two weeks
            message: { $exists: true, $type: "string" }, // Ensure the message exists and is a string
            $expr: { $gt: [{ $strLenCP: "$message" }, 20] }, // Message length more than 20 characters
            $nor: [
              // Exclude messages that contain any of the following phrases
              { message: { $regex: "Good news!!", $options: "i" } },
              { message: { $regex: "Follow or Subscribe to me NOW", $options: "i" } },
              { message: { $regex: "How can we help?", $options: "i" } },
              { message: { $regex: "SEP 1ST", $options: "i" } },
              { message: { $regex: "How far", $options: "i" } },
            ],
          },
        },
        {
          $group: {
            _id: "$roomID", // Group by roomID
            messages: {
              $push: {
                message: "$message",
                receiverName: "$receiverName", // Include receiverName in the group
              },
            },
          },
        },
        {
          $sort: { created: 1 }, // Sort by createdAt
        },
      ],
      { allowDiskUse: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed, { messages });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - test-uuid",
      error,
    });
  }
});

router.get("/test-file-gpt", async (request, response) => {
  try {
    const res = await Logics.getGPTAssistantResponse(
      Const.FlomTeamAssistantId,
      "63de7115a62453346de15d96",
      "what is Flom",
    ); // Added await

    Base.successResponse(response, Const.responsecodeSucceed, { res });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - test-uuid",
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

router.get("/recombeedel", async (request, response) => {
  try {
    await recombee.deleteAllItems();
    await recombee.deleteAllUsers();

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    console.error(error);
    Base.newErrorResponse({
      response,
      message: "FixController - recombee",
      error,
    });
  }
});

router.get("/recombee", async (request, response) => {
  try {
    await recombee.syncUsers(0);

    await Utils.sleep(10000);

    await recombee.syncProducts(0);

    await Utils.sleep(10000);

    await recombee.syncLiveStreams(0);

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    console.error(error);
    Base.newErrorResponse({
      response,
      message: "FixController - recombee",
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
  try {
    let hasMore = true;
    const limit = 1000;
    let offset = 0;
    const uuids = [];
    const phoneToUuidMap = {};

    while (hasMore) {
      const ops = [];

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
        .limit(limit)
        .lean();

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      offset = users[users.length - 1].created;

      for (const user of users) {
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
      }

      await CoreIdentity.bulkWrite(ops);
      logger.info(
        `Processed ${users.length} users, last created processed: ${new Date(
          offset,
        ).toISOString()}`,
      );

      if (hasMore) await Utils.sleep(2000);
    }

    Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - core-ids",
      error,
    });
  }
});

module.exports = router;
