"use strict";

const router = require("express").Router();
const { logger } = require("#infra");
const { Config } = require("#config");
const Utils = require("#utils");
const { LiveStream } = require("#models");
const { recombee } = require("#services");
const { callbackHandlers } = require("../helpers");

router.post("/", async function (request, response) {
  try {
    try {
      response.sendStatus(200);

      if (
        request.body?.action &&
        request.body.action === "liveStreamEnded" &&
        Config.environment === "production"
      ) {
        const liveStreamId = request.body.streamName;
        const liveStream = await LiveStream.findById(liveStreamId).lean();
        if (!liveStream) {
          await Utils.sendRequest({
            method: "POST",
            url: `${Config.devWebClientUrl}/api/v2/livestreams/cb`,
            headers: { "Content-Type": "application/json" },
            body: request.body,
          });

          return;
        }
      }

      let data = "";
      if (request.body?.action) {
        data = request.body;
      } else {
        const { fields = {}, files = {} } = await Utils.formParse(request, {
          keepExtensions: true,
          type: "multipart",
          multiples: true,
          uploadDir: Config.uploadPath,
        });

        try {
          data = JSON.parse(fields.data || "");
        } catch (error) {
          logger.warn(
            "AntMediaCallbackController, no JSON object in data string: " + JSON.stringify(fields),
          );
          return;
        }

        if (
          data.environment &&
          data.environment === "development" &&
          Config.environment === "production"
        ) {
          await Utils.sendRequest({
            method: "POST",
            url: `${Config.devWebClientUrl}/api/v2/livestreams/cb`,
            headers: { "Content-Type": "multipart/form-data" },
            body: fields,
          });

          return;
        }
      }

      logger.debug("AntMediaCallbackController, received callback data: " + JSON.stringify(data));

      const { messageType, liveStreamId, commentData, userData, action, id } = data;

      if (!messageType && !action) {
        return;
      }

      if (messageType) {
        if (!["joinedToStream", "sendComment", "leaveFromStream"].includes(messageType)) {
          return;
        }

        const liveStream = await LiveStream.findById(liveStreamId).lean();
        if (!liveStream) return;

        switch (messageType) {
          case "sendComment":
            await callbackHandlers.sendComment({ liveStream, commentData });
            break;
          case "joinedToStream":
            await callbackHandlers.joinedToStream({ liveStream, userData });
            break;
          case "leaveFromStream":
            await callbackHandlers.leaveFromStream({ liveStream, userData });
            break;
          default:
            break;
        }
      } else if (action) {
        if (action !== "liveStreamEnded") return;

        const liveStream = await LiveStream.findById(id).lean();
        if (!liveStream) return;

        try {
          await recombee.deactivateLiveStreams({ liveStreams: [liveStream] });
        } catch (error) {
          logger.error("AntMediaCallbackController, recombee error: ", error);
        }
      } else {
        logger.error(
          "AntMediaCallbackController, no valid messageType or action in data: " +
            JSON.stringify(data),
        );
        return;
      }

      return;
    } catch (error) {
      logger.error("AntMediaCallbackController", error);
      return;
    }
  } catch (error) {
    logger.error("AntMediaCallbackController", error);

    return;
  }
});

module.exports = router;
