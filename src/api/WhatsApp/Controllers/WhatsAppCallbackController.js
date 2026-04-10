"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger, encryptionManager } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { FlomMessage, User } = require("#models");
const { sendMessage } = require("#logics");

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

    if (!messages.length) {
      logger.debug("WhatsAppCallbackController, no messages in callback");
      return;
    }

    const flomNumber = value.metadata?.display_phone_number ?? null;
    const phoneNumberId = value.metadata?.phone_number_id ?? null;

    if (Config.environment === "production" && phoneNumberId === Config.whatsAppDevPhoneNumberId) {
      await Utils.sendRequest({
        method: "POST",
        url: `${Config.devWebClientUrl}/api/v2/whatsapp/cb`,
        headers: { "Content-Type": "application/json" },
        body: request.body,
      });

      return;
    }

    for (const message of messages) {
      try {
        const from = "+" + message.from;
        const wamId = message.id;
        const timeStamp = +message.timestamp * 1000;
        const msgBody = message.text?.body ?? "";

        console.log(`${flomNumber} message from ${from}: ${msgBody}`);

        const contextId = message.context?.id ?? null;

        if (!contextId) {
          await handleNewChatMessage({ from, msgBody, wamId, timeStamp });
        } else {
          await handleReplyMessage({ from, msgBody, wamId, timeStamp, contextId });
        }
      } catch (error) {
        logger.error("WhatsAppCallbackController, cb: message processing error", error);
        continue;
      }
    }

    return;
  } catch (error) {
    logger.error("WhatsAppCallbackController, cb", error);
  }
});

async function handleNewChatMessage({ from, msgBody, wamId, timeStamp }) {
  const arr = msgBody.split(": ");
  if (arr.length < 2) {
    logger.error(
      "WhatsAppCallbackController, cb: message body does not contain ': ' separator: " + msgBody,
    );
    return;
  }

  const fromUser = await User.findOne({ phoneNumber: from }).lean();
  if (!fromUser) {
    logger.error("WhatsAppCallbackController, cb: fromUser not found with phoneNumber: " + from);
    return;
  }

  const toUserName = arr.length > 1 ? arr[0] : "WhatsApp User";
  const messageText = arr.length > 1 ? arr[1] : msgBody;

  const toUser = await User.findOne({ userName: toUserName }).lean();
  if (!toUser) {
    logger.error("WhatsAppCallbackController, cb: toUser not found with userName: " + toUserName);
    return;
  }

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
    type: Const.messageTypeWhatsApp,
    userID: fromUser._id.toString(),
    roomID: roomId,
    message: encryptionManager.encryptText(messageText),
    created: timeStamp,
    wamId,
  };

  await sendMessage(params);

  return;
}

async function handleReplyMessage({ from, msgBody, wamId, timeStamp, contextId }) {
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

  const params = {
    isRecursiveCall: false,
    type: Const.messageTypeWhatsApp,
    userID: fromUser._id.toString(),
    roomID: originalMessage.roomID,
    message: msgBody,
    created: timeStamp,
    wamId,
    attributes: {
      replyMessage: {
        _id: originalMessage._id.toString(),
        created: originalMessage.created,
        roomID: originalMessage.roomID,
        type: originalMessage.type,
        userId: toUser._id.toString(),
        userName: toUser.userName,
        message: encryptionManager.encryptText(originalMessage.message), // encrypted
      },
    },
  };

  await sendMessage(params);

  return;
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
