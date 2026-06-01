"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger, redis } = require("#infra");
const { Const, Config } = require("#config");
const { User, WhatsAppLog } = require("#models");
const helpers = require("../helpers");

router.get("/", async function (request, response) {
  try {
    const {
      "hub.mode": mode,
      "hub.challenge": challenge,
      "hub.verify_token": token,
    } = request.query;

    if (mode === "subscribe" && token === "wPGOoMRkOiMlIgofTDycqWyKEnXGMxVf") {
      console.log("WEBHOOK VERIFIED");
      response.status(200).send(challenge);
    } else {
      response.status(403).end();
    }

    return;
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "WhatsAppCallbackController, cb verify",
      error,
    });
  }
});

router.post("/", async function (request, response) {
  Base.successResponse(response, Const.responsecodeSucceed);

  try {
    const change = request.body.entry?.[0]?.changes?.[0] ?? null;
    if (!change) {
      logger.debug("WhatsAppCallbackController, no changes in callback");
      return;
    }

    const value = change.value;
    const messages = value.messages ?? [];
    const statuses = value.statuses ?? [];

    if (!messages.length && !statuses.length) {
      logger.debug("WhatsAppCallbackController, no messages or statuses in callback");
      return;
    }

    const wamNumber = value.metadata?.display_phone_number ?? null;
    // const wamNumberId = value.metadata?.phone_number_id ?? null;

    for (const message of messages) {
      try {
        const from = "+" + message.from;
        const wamId = message.id;
        const timeStamp = +message.timestamp * 1000;
        const msgBody = message.text?.body ?? "";
        const expiration = timeStamp + 24 * 60 * 60 * 1000; // 24h

        const handledWamId = await redis.get(`handled_wam_id:${wamId}`);

        if (handledWamId) {
          logger.warn(
            `WhatsAppCallbackController, cb: already handled incoming message with wamId: ${wamId}, skipping processing`,
          );
          return;
        }
        await redis.set(`handled_wam_id:${wamId}`, Date.now().toString(), "EX", 24 * 60 * 60); // 24h

        console.log(`${wamNumber} message from ${from}: ${msgBody}`);

        const contextId = message.context?.id ?? null;

        const log = await WhatsAppLog.create({
          wamId,
          callback: request.body,
          from,
          direction: "incoming",
          providerId: Config.whatsAppPhoneNumberId,
          providerPhoneNumber: Config.whatsAppPhoneNumber,
        });

        if (!contextId) {
          await helpers.handleNewChatMessage({
            from,
            msgBody,
            wamId,
            timeStamp,
            logId: log._id.toString(),
          });
        } else {
          await helpers.handleReplyMessage({
            from,
            msgBody,
            wamId,
            timeStamp,
            contextId,
            logId: log._id.toString(),
          });
        }

        await User.updateOne(
          { phoneNumber: from },
          {
            $set: { "whatsApp.windowExpiresAt": expiration, "whatsApp.followupMessageSent": false },
          },
        );
      } catch (error) {
        logger.error("WhatsAppCallbackController, cb: incoming message processing error", error);
        continue;
      }
    }

    if (messages.length > 0) {
      await helpers.sendPendingWhatsAppMessages(messages[0].from);
    }

    for (const message of statuses) {
      try {
        const to = "+" + message.recipient_id;
        const wamId = message.id;
        const status = message.status;
        const errors = message.errors ?? null;

        console.log(`${wamNumber} message to ${to}: ${wamId}, status: ${status}`);

        await helpers.handleOutgoingMessage({ to, status, wamId, errors, callback: request.body });
      } catch (error) {
        logger.error("WhatsAppCallbackController, cb: outgoing message processing error", error);
        continue;
      }
    }

    return;
  } catch (error) {
    logger.error("WhatsAppCallbackController, cb", error);
  }
});

module.exports = router;
