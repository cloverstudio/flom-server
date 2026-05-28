"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger, encryptionManager } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { FlomMessage, User, WhatsAppUserMapping, WhatsAppLog, WhatsAppSession } = require("#models");
const Logics = require("#logics");

const alreadyHandledIncomingWamIds = [];

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

        if (alreadyHandledIncomingWamIds.includes(wamId)) {
          logger.warn(
            `WhatsAppCallbackController, cb: already handled incoming message with wamId: ${wamId}, skipping processing`,
          );
          return;
        }
        alreadyHandledIncomingWamIds.push(wamId);

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
          await handleNewChatMessage({
            from,
            msgBody,
            wamId,
            timeStamp,
            logId: log._id.toString(),
          });
        } else {
          await handleReplyMessage({
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
      await sendPendingWhatsAppMessages(messages[0].from);
    }

    for (const message of statuses) {
      try {
        const to = "+" + message.recipient_id;
        const wamId = message.id;
        const status = message.status;
        const errors = message.errors ?? null;

        console.log(`${wamNumber} message to ${to}: ${wamId}, status: ${status}`);

        await handleOutgoingMessage({ to, status, wamId, errors, callback: request.body });
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

async function handleNewChatMessage({ from, msgBody, wamId, timeStamp, logId }) {
  let fromUser = await User.findOne({ phoneNumber: from }).lean();

  if (!fromUser) {
    fromUser = await Logics.createNewUser({
      phoneNumber: from,
      isAppUser: false,
      shadow: true,
      hasLoggedIn: Const.userShadowUser,
      phoneNumberStatus: Const.phoneNumberUntested,
    });
  }

  let toUser = null;

  const regexRef = /ref_([A-Za-z]+)/;
  const refMatch = msgBody.match(regexRef);
  if (refMatch) {
    const reference = refMatch[1];
    toUser = await User.findOne({ "whatsApp.reference": reference }).lean();
  }

  if (!toUser) {
    const regexMention = /(?<!\w)@([a-zA-Z0-9_]+)/g;
    const matches = [...msgBody.matchAll(regexMention)];
    const toUserName = matches.length > 0 ? matches[0][1] : null;

    if (toUserName) {
      toUser = await User.findOne({ $or: [{ slug: toUserName }, { oldSlug: toUserName }] }).lean();
    }
  }

  if (!toUser) {
    const session = await WhatsAppSession.findOne({ from }).sort({ expiresAt: -1 }).lean();

    if (session && session.expiresAt > new Date()) {
      toUser = await User.findOne({ phoneNumber: session.to }).lean();
    } else if (session) {
      toUser = await User.findOne({ phoneNumber: session.to }).lean();

      await Logics.sendWhatsAppMessage({
        to: from,
        message: `Continue with @${session.toSlug}?        
        If yes, please reply with "yes @${session.toSlug}" and repeat your message, otherwise please reply with the name (@name) or reference (ref_123) of the person you want to contact.`,
        isFreeMessage: true,
      });

      return;
    }
  }

  if (!toUser) {
    if (!fromUser.whatsApp?.receivedUnknownRecipientNotice) {
      await Logics.sendWhatsAppMessage({
        to: from,
        template: "unknownRecipientNotice",
      });

      await User.updateOne(
        { _id: fromUser._id },
        { $set: { "whatsApp.receivedUnknownRecipientNotice": true } },
      );
    }

    logger.error(
      "WhatsAppCallbackController, cb: toUser not found from message: " +
        msgBody +
        " and sender: " +
        from,
    );
    return;
  }

  await WhatsAppSession.updateOne(
    { from, to: toUser.phoneNumber },
    { toSlug: toUser.slug, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { upsert: true },
  );

  // mapping is reversed (sender is receiver etc) because we want to find the mapping with sender and receiver phone numbers when sending message from app to whatsapp
  await WhatsAppUserMapping.findOneAndUpdate(
    {
      senderId: toUser._id.toString(),
      senderPhoneNumber: toUser.phoneNumber,
      receiverId: fromUser._id.toString(),
      receiverPhoneNumber: from,
    },
    { $set: { enabled: true } },
    { upsert: true },
  );

  await WhatsAppLog.findByIdAndUpdate(logId, { to: toUser.phoneNumber });

  let roomId = null;
  if (toUser && fromUser.created < toUser.created) {
    roomId = `1-${fromUser._id.toString()}-${toUser?._id.toString()}`;
  } else if (toUser) {
    roomId = `1-${toUser?._id.toString()}-${fromUser._id.toString()}`;
  }
  if (!roomId) {
    logger.error("WhatsAppCallbackController, cb: invalid roomId");
    return;
  }

  const params = {
    isRecursiveCall: false,
    type: Const.messageTypeText,
    userID: fromUser._id.toString(),
    roomID: roomId,
    message: msgBody,
    created: timeStamp,
    wamId,
    plainTextMessage: true,
  };

  await Logics.sendMessage(params);

  return;
}

async function handleReplyMessage({ from, msgBody, wamId, timeStamp, contextId, logId }) {
  const originalMessage = await FlomMessage.findOne({ wamId: contextId }).lean();
  if (!originalMessage) {
    logger.error("WhatsAppCallbackController, cb: original message not found: ", contextId);
    return;
  }

  const fromUser = await User.findOne({ phoneNumber: from }).lean();
  if (!fromUser) {
    logger.error("WhatsAppCallbackController, cb: fromUser not found with phoneNumber: " + from);
    return;
  }

  const toUser = await User.findById(originalMessage.userID).lean();
  if (!toUser) {
    logger.error(
      "WhatsAppCallbackController, cb: toUser not found with userID: " + originalMessage.userID,
    );
    return;
  }

  await WhatsAppSession.updateOne(
    { from, to: toUser.phoneNumber },
    { toSlug: toUser.slug, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { upsert: true },
  );

  await WhatsAppLog.findByIdAndUpdate(logId, { to: toUser.phoneNumber });

  const params = {
    isRecursiveCall: false,
    type: Const.messageTypeText,
    userID: fromUser._id.toString(),
    roomID: originalMessage.roomID,
    message: msgBody,
    created: timeStamp,
    wamId,
    plainTextMessage: true,
    attributes: {
      replyMessage: {
        _id: originalMessage._id.toString(),
        created: originalMessage.created,
        roomID: originalMessage.roomID,
        type: originalMessage.type,
        userId: toUser._id.toString(),
        userName: toUser.userName,
        message: encryptionManager.encryptText(originalMessage.message), // encrypted
        decryptedMessage: originalMessage.message,
      },
    },
  };

  await Logics.sendMessage(params);

  return;
}

async function handleOutgoingMessage({ to, status, wamId, errors, callback }) {
  const user = await User.findOne({ phoneNumber: to }).lean();
  const flomMessage = await FlomMessage.findOne({ wamId }).lean();

  await WhatsAppLog.findOneAndUpdate({ wamId }, { status, callback, failures: errors });

  // if no chat message found then it is probably a WA notification
  if (!flomMessage) {
    return;
  }

  if (status === "sent") {
    await FlomMessage.updateOne(
      { wamId },
      { $addToSet: { sentTo: user._id.toString() }, $set: { wamStatus: status } },
    );
  } else if (status === "delivered") {
    const deliveredTo = flomMessage?.deliveredTo;

    let alreadyDelivered = false;
    if (deliveredTo) {
      for (const item of deliveredTo) {
        if (item.userId === user._id.toString()) {
          item.at = Date.now();
          alreadyDelivered = true;
          await FlomMessage.updateOne(
            { wamId },
            { $set: { deliveredTo: deliveredTo, wamStatus: status } },
          );
          break;
        }
      }
    }

    if (!alreadyDelivered) {
      await FlomMessage.updateOne(
        { wamId },
        {
          $addToSet: { deliveredTo: { userId: user._id.toString(), at: Date.now() } },
          $set: { wamStatus: status },
        },
      );
    }
  } else if (status === "read") {
    const seenBy = flomMessage?.seenBy ?? [];

    let alreadySeen = false;
    for (const item of seenBy) {
      if (item.user === user._id.toString()) {
        item.at = Date.now();
        alreadySeen = true;
        await FlomMessage.updateOne({ wamId }, { $set: { seenBy: seenBy, wamStatus: status } });
        break;
      }
    }

    if (!alreadySeen) {
      await FlomMessage.updateOne(
        { wamId },
        {
          $addToSet: { seenBy: { user: user._id.toString(), at: Date.now() } },
          $set: { wamStatus: status },
        },
      );
    }
  } else if (status === "failed" || !!errors) {
    await FlomMessage.updateOne(
      { wamId },
      { $set: { "attributes.errors": errors, wamStatus: status } },
    );
  }
}

const userLockMap = {};

async function sendPendingWhatsAppMessages(from) {
  try {
    if (!from) {
      logger.error(
        "WhatsAppCallbackController, sendPendingWhatsAppMessages error, missing from parameter",
      );
      return;
    }

    if (!from.startsWith("+")) {
      from = "+" + from;
    }

    if (userLockMap[from]) {
      logger.warn(
        `WhatsAppCallbackController, sendPendingWhatsAppMessages, already sending pending messages for sender: ${from}`,
      );
      return;
    }

    userLockMap[from] = true;

    const receiver = await User.findOne({ phoneNumber: from }).lean();
    if (!receiver) {
      logger.error(
        "WhatsAppCallbackController, sendPendingWhatsAppMessages error, receiver not found with phoneNumber: " +
          from,
      );
      delete userLockMap[from];
      return;
    }

    const pendingMessages = await FlomMessage.find({
      wamStatus: "pending",
      receiverPhoneNumber: from,
      type: Const.messageTypeText,
      $and: [{ message: { $ne: null } }, { message: { $ne: "" } }], // filter out messages with empty or null message field and deleted messages
    })
      .sort({ created: 1 })
      .lean();

    if (pendingMessages.length === 0) {
      delete userLockMap[from];
      return;
    }

    logger.info(
      `WhatsAppCallbackController, sendPendingWhatsAppMessages, found ${pendingMessages.length} pending messages for sender: ${from}`,
    );

    for (const m of pendingMessages) {
      const wamIds = await Logics.sendWhatsAppMessages({
        senderId: m.userID,
        receivers: [receiver],
        message: m.message,
      });

      if (wamIds.length > 0) {
        await FlomMessage.updateOne({ _id: m._id }, { $set: { wamId: wamIds[0] } });

        let breakLoop = false,
          attempts = 0;
        const limit = 20;

        while (breakLoop === false && attempts < limit) {
          const log = await WhatsAppLog.findOne({ wamId: wamIds[0] }).lean();
          attempts++;

          if (log && log.status && ["delivered", "read"].includes(log.status)) {
            breakLoop = true;
          }

          await Utils.sleep(3000); // wait 3 seconds before checking the status again
        }

        if (!breakLoop) {
          logger.error(
            `WhatsAppCallbackController, sendPendingWhatsAppMessages error, message with id: ${m._id.toString()} was not sent after ${attempts} attempts`,
          );
          // await FlomMessage.updateOne({ _id: m._id }, { $set: { wamStatus: "failed" } });

          break;
        }
      } else {
        logger.error(
          `WhatsAppCallbackController, sendPendingWhatsAppMessages error, failed to send message with id: ${m._id.toString()} to ${from}`,
        );
        // await FlomMessage.updateOne({ _id: m._id }, { $set: { wamStatus: "failed" } });
        break;
      }

      await Utils.sleep(2000); // wait 2 seconds between messages
    }

    delete userLockMap[from];
    return;
  } catch (error) {
    logger.error("WhatsAppCallbackController, sendPendingWhatsAppMessages error", error);
    delete userLockMap[from];
    return;
  }
}

module.exports = router;

/*
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1799673154249994",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "56942794765",
              "phone_number_id": "828448387028500"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Petar Biocic"
                },
                "wa_id": "385958710207"
              }
            ],
            "messages": [
              {
                "from": "385958710207",
                "id": "wamid.HBgMMzg1OTU4NzEwMjA3FQIAEhggQUM0MDMwQTVGNjc4Nzk2QzdGQTJERTlGNkNEREUxMkYA",
                "timestamp": "1765982290",
                "text": {
                  "body": "Ajmo"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
*/

/*
{
  "object":"whatsapp_business_account",
  "entry":[
     {
        "id":"1799673154249994",
        "changes":[
           {
              "value":{
                 "messaging_product":"whatsapp",
                 "metadata":{
                    "display_phone_number":"56942794765",
                    "phone_number_id":"828448387028500"
                 },
                 "contacts":[
                    {
                       "profile":{
                          "name":"Petar Biocic"
                       },
                       "wa_id":"385958710207"
                    }
                 ],
                 "messages":[
                    {
                       "context":{
                          "from":"56942794765",
                          "id":"wamid.HBgMMzg1OTU4NzEwMjA3FQIAERgSODYwMjYzMDFDQUE4NTUxMzBEAA=="
                       },
                       "from":"385958710207",
                       "id":"wamid.HBgMMzg1OTU4NzEwMjA3FQIAEhggQUM5NTg2MTFENDk0MEYyRkQyMjQzNTg4QjYyRjc5MEYA",
                       "timestamp":"1766560903",
                       "text":{
                          "body":"Quoting this message."
                       },
                       "type":"text"
                    }
                 ]
              },
              "field":"messages"
           }
        ]
     }
  ]
}
*/

/*
{
   "object":"whatsapp_business_account",
   "entry":[
      {
         "id":"1799673154249994",
         "changes":[
            {
               "value":{
                  "messaging_product":"whatsapp",
                  "metadata":{
                     "display_phone_number":"56942794765",
                     "phone_number_id":"828448387028500"
                  },
                  "statuses":[
                     {
                        "id":"wamid.HBgMMzg1OTU4NzEwMjA3FQIAERgSRjhCRjQ0Qzg3RThFREFDQUY0AA==",
                        "status":"sent",  delivered, read
                        "timestamp":"1776085049",
                        "recipient_id":"385958710207",
                        "conversation":{
                           "id":"94a66415aeea225d03e46aa7a1a98d9f",
                           "expiration_timestamp":"1776085049",
                           "origin":{
                              "type":"marketing"
                           }
                        },
                        "pricing":{
                           "billable":true,
                           "pricing_model":"PMP",
                           "category":"marketing",
                           "type":"regular"
                        }
                     }
                  ]
               },
               "field":"messages"
            }
         ]
      }
   ]
}
*/
