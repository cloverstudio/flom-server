"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, FlomMessage, Test, NonFlomContact } = require("#models");
const fs = require("fs");
const path = require("path");
const { recombee } = require("#services");

let runLoop = true;

async function startLoop(skip = 0) {
  try {
    let singles = 0;

    while (runLoop) {
      const item = (
        await NonFlomContact.find({})
          .skip(skip + singles)
          .limit(1)
          .lean()
      )[0];

      if (item) {
        console.log("contacts fix, item found: ", item);

        const allItems = await NonFlomContact.find({
          userId: item.userId,
          hashedPhoneNumber: item.hashedPhoneNumber,
        }).lean();

        console.log("contacts fix, allItems length: ", allItems.length);

        if (allItems.length > 1) {
          allItems.sort((a, b) => {
            return a._id.toString() < b._id.toString()
              ? -1
              : a._id.toString() > b._id.toString()
              ? 1
              : 0;
          });

          const itemsToDelete = allItems.slice(0, -1);
          await NonFlomContact.deleteMany({
            _id: { $in: itemsToDelete.map((item) => item._id) },
          });
        } else {
          singles++;
        }
      }

      //console.log("contacts fix, waiting 60 seconds...");

      console.log("contacts fix, singles: ", singles);
      await Utils.wait(2);
    }
  } catch (error) {
    console.error(error);
  }
}

router.get("/playlist/:fileName", async (request, response) => {
  try {
    const filePath = "/shared/playlist-test/" + request.params.fileName;

    if (fs.existsSync(filePath)) {
      return response.sendFile(filePath);
    } else {
      console.log("playlist file doesn't exist");
    }

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - playlist files",
      error,
    });
  }
});

router.get("/env", async (request, response) => {
  try {
    Base.successResponse(response, Const.responsecodeSucceed, { env: process.env });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - env",
      error,
    });
  }
});

router.get("/distinct", async (request, response) => {
  try {
    const distinct = await User.find({ countryCode: "HR" }).distinct("phoneNumber");

    console.log(distinct);

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - distinct",
      error,
    });
  }
});

router.get("/symlink", async (request, response) => {
  try {
    const filePath = path.resolve(Config.uploadPath, "testmeet/test.txt");
    console.log(filePath);

    response.sendFile(filePath);

    //Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - symlink",
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

    const flomAgent = await User.findById(Config.flomSupportUserId).lean();

    const message = `Test for push type: ${pushType}, isMuted: ${mute}`;

    await Utils.sendFlomPush({
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

    const result = await Utils.callChatGPTApi(text, "0", "0", false);

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

router.get("/h", async (request, response) => {
  try {
    await Test.create({ headers: request.headers });

    response.redirect("https://index.hr");
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FixController - h",
    });
  }
});

router.get("/test-file-gpt", async (request, response) => {
  try {
    const res = await Utils.getGPTAssistantResponse(
      Const.FlomTeamAssistantId,
      "63de7115a62453346de15d96",
      "what is Flom",
    ); // Added await

    Base.successResponse(response, Const.responsecodeSucceed, { res });
  } catch (error) {
    console.error(error);
    Base.newErrorResponse({
      response,
      message: "FixController - test-uuid",
    });
  }
});

router.get("/pushtest/:pushType", async (request, response) => {
  try {
    const pushType = +request.params.pushType;

    const user = await User.findOne({ phoneNumber: "+385958710207" }).lean();
    const sender = await User.findById(process.env.SUPPORT_USER_ID).lean();

    await Utils.sendFlomPush({
      newUser: sender,
      receiverUser: user,
      message: "message",
      messageiOs: "message iOs",
      pushType,
      isMuted: true,
    });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    console.error(error);
    Base.newErrorResponse({
      response,
      message: "FixController - pushtest",
    });
  }
});

router.get("/datetime", async (request, response) => {
  try {
    const res = await Test.findById("675b743ce16a0d1ac03e6b77");
    console.log(res.datetime instanceof Date);

    const res2 = await Test.findById("675b743ce16a0d1ac03e6b77").lean();
    console.log(res2.datetime instanceof Date);

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    console.error(error);
    Base.newErrorResponse({
      response,
      message: "FixController - datetime",
    });
  }
});

router.post("/contacts", async (request, response) => {
  try {
    const action = request.body.action;
    const skip = parseInt(request.body.skip, 10) || 0;

    console.log(action, skip);

    if (action === "start") {
      runLoop = true;
      startLoop(skip);
    } else if (action === "stop") {
      runLoop = false;
    } else {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAction,
        message: "FixController - contacts, invalid action",
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    console.error(error);
    Base.newErrorResponse({
      response,
      message: "FixController - contacts",
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
    });
  }
});

router.get("/recombee", async (request, response) => {
  try {
    await recombee.syncUsers(0);

    await Utils.wait(10);

    await recombee.syncProducts(0);

    await Utils.wait(10);

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

router.get("/rtest", async (request, response) => {
  try {
    await recombee.test({ scenario: "for_you" });

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
    });
  }
});

module.exports = router;
