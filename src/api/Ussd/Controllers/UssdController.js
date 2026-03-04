"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config, countries } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { OfflineMessage, RegistrationLink } = require("#models");
const { sendMessage, createOfflineMessage, getFirstUnreadTextMessage } = require("#logics");

/*
      * @api {post} /api/v2/ussd/ussdSessionEvent/new New session initiated by customer
      * @apiName New session initiated by customer
      * @apiGroup WebAPI
      * @apiDescription New session initiated by customer
      *   
			* @apiParam clientId  - a developer's profile identifier
			* @apiParam appId  - a developer's USSD application identifier on Qrios platform
			* @apiParam sessionId  - a unique identifier of current USSD session (it stays unchanged from the beginning of the session to its end)
			* @apiParam msisdn  - a customer phone number
			* @apiParam operator  - a network operator of customer's phone number
			* @apiParam input  - this is a type of user's input. In the example above, it means that the customer dialed string *425*026#
      * 
      * @apiSuccessExample Success-Response:
        {
					"action": {
						"type": "ShowView",
						"view": {
							"type": "InputView",
							"message": "Hello world! Please enter your name:"
						}
					},
					"contextData": "devCorrelationId:12345"
				}
 
     */

router.post("/ussdSessionEvent/new", async (request, response) => {
  try {
    console.log("UssdController request body: " + JSON.stringify(request.body));

    response.sendStatus(200);

    /*
      const { sessionId, msisdn, input = {} } = request.body;
      const { shortcodeString, contextData } = input;
      console.log({ sessionStart: request.body });

      const getUssdSessionType = (shortcode, contextData) => {
        if (contextData && contextData.startsWith("1:")) {
          return Const.UssdSessionTypeReadMessage;
        }
        const shortcodeArray = shortcode.split("*");
        if (shortcodeArray.length > 3) {
          if (shortcodeArray[3].startsWith("000")) {
            return Const.UssdSessionTypeGetMessages;
          } else {
            return Const.UssdSessionTypeSendMessage;
          }
        } else {
          return Const.UssdSessionTypeUnknown;
        }
      };

      const ussdSessionType = getUssdSessionType(shortcodeString, contextData);
      const getReceiverPhoneNumberFromShortcode = (shortcode) => {
        let receiverPhoneNumber = shortcode.split("*")[3].slice(0, -1);

        if (!receiverPhoneNumber || receiverPhoneNumber.length < 9) {
          throw new Error(`${receiverPhoneNumber} is not valid phone number!`);
        }

        if (receiverPhoneNumber.length < 12) {
          if (receiverPhoneNumber.startsWith("0")) {
            receiverPhoneNumber = receiverPhoneNumber.substring(1);
          }
          receiverPhoneNumber = `234${receiverPhoneNumber}`;
        }

        return `+${receiverPhoneNumber}`;
      };

      const handleSendOfflineMessage = async ({
        sessionId,
        senderPhoneNumber,
        shortcodeString,
      }) => {
        const receiverPhoneNumber = getReceiverPhoneNumberFromShortcode(shortcodeString);

        const offlineMessage = await createOfflineMessage({
          senderPhoneNumber,
          receiverPhoneNumber,
          sessionId,
        });

        return {
          action: {
            type: "ShowView",
            view: {
              type: "InputView",
              message: "Hello! Please enter your message:",
            },
          },
          contextData: offlineMessage._id.toString(),
        };
      };

      const handleGetMessages = async ({ sessionId, senderPhoneNumber, shortcodeString }) => {
        const receiverPhoneNumber = `+${getReceiverPhoneNumberFromShortcode(
          shortcodeString
        ).substring(4)}`;

        const firstUnreadTextMessage = await getFirstUnreadTextMessage({
          senderPhoneNumber,
          receiverPhoneNumber,
        });

        return {
          action: {
            type: "ShowView",
            view: {
              type: "InfoView",
              message: firstUnreadTextMessage,
            },
          },
          contextData: "data",
        };
      };

      const handleUnknown = async ({ sessionId, senderPhoneNumber, shortcodeString }) => {
        return {
          action: {
            type: "ShowView",
            view: {
              type: "InfoView",
              message: "To send offline Flom message dial *425*026*PHONE_NUMBER#",
            },
          },
          contextData: "data",
        };
      };

      const handleReadMessage = async ({ sessionId, senderPhoneNumber, contextData }) => {
        const _id = contextData.split(":")[1];

        const offlineMessage = await OfflineMessage.findOne({ _id });

        if (offlineMessage) {
          const { userPhoneNumber: receiverPhoneNumber, message } = offlineMessage;
          const newOfflineMessage = await createOfflineMessage({
            senderPhoneNumber,
            receiverPhoneNumber,
            sessionId,
          });

          return {
            action: {
              type: "ShowView",
              view: {
                type: "InputView",
                message,
              },
            },
            contextData: newOfflineMessage._id.toString(),
          };
        }
      };

      const actions = {
        [Const.UssdSessionTypeSendMessage]: handleSendOfflineMessage,
        [Const.UssdSessionTypeGetMessages]: handleGetMessages,
        [Const.UssdSessionTypeReadMessage]: handleReadMessage,
        [Const.UssdSessionTypeUnknown]: handleUnknown,
      };

      const action = await actions[ussdSessionType]({
        sessionId,
        senderPhoneNumber: `+${msisdn}`,
        shortcodeString,
        contextData,
      });

      console.log({ ussdRequest: request.body, action });

      response.send(action);
      */
  } catch (error) {
    console.log("error in ussd Controller: ", error);
    response.send({
      action: {
        type: "ShowView",
        view: {
          type: "InfoView",
          message: error.message,
        },
      },
      contextData: "data",
    });
  }
});

router.post("/ussdSessionEvent/continue", async (request, response) => {
  try {
    const { sessionId, result } = request.body;
    const { value } = result;
    console.log("continue session: ", sessionId, { session: request.body });
    response.sendStatus(200);

    /*
      const offlineMessage = await OfflineMessage.findOne({ sessionId });

      offlineMessage.plainTextMessage = true;
      offlineMessage.message = value;
      await offlineMessage.save();

      const messageParams = {
        roomID: offlineMessage.roomID,
        userID: offlineMessage.userID,
        message: offlineMessage.message,
        type: offlineMessage.type,
        plainTextMessage: offlineMessage.plainTextMessage,
      };

      SendMessageLogic.send(
        messageParams,
        (error) => {
          console.log("send msg error: ", { error });
          throw new Error("Failed to send message, please try again");
        },
        async (messageObj) => {
          console.log({ messageObj });
          offlineMessage.sent = true;
          await offlineMessage.save();

          response.send({
            action: {
              type: "ShowView",
              view: {
                type: "InfoView",
                message: "Message sent!",
              },
            },
            contextData: offlineMessage._id.toString(),
          });

          await handleNotifications(offlineMessage.toObject());
        }
      );
      */
  } catch (error) {
    console.log("error in ussd Controller: ", error);
    response.send({
      action: {
        type: "ShowView",
        view: {
          type: "InfoView",
          message: error.message,
        },
      },
      contextData: "data",
    });
  }
});

router.post("/ussdSessionEvent/close", async (request, response) => {
  try {
    console.log("closed", { ussdRequest: request.body });
    response.sendStatus(204);
  } catch (error) {
    console.log("error in ussd Controller: ", error);
    response.send({
      action: {
        type: "ShowView",
        view: {
          type: "InfoView",
          message: "Something went wrong! Please try again later.",
        },
      },
      contextData: "devCorrelationId:12345",
    });
  }
});

router.post("/ussdSessionEvent/abort", async (request, response) => {
  try {
    console.log("aborted", { ussdRequest: request.body });
    response.sendStatus(204);
  } catch (error) {
    console.log("error in ussd Controller: ", error);
    response.send({
      action: {
        type: "ShowView",
        view: {
          type: "InfoView",
          message: "Something went wrong! Please try again later.",
        },
      },
      contextData: "devCorrelationId:12345",
    });
  }
});

async function handleNotifications(offlineMessage) {
  const {
    userID,
    userPhoneNumber,
    receiverID,
    receiverPhoneNumber,
    receiverUserIsNew,
    senderUserIsNew,
    _id,
  } = offlineMessage;

  if (senderUserIsNew) {
    await createAndSendInvitation({
      userId: userID,
      phoneNumber: userPhoneNumber,
      ref: receiverID,
      message: "Thank you for using Flom. ",
    });
  }

  if (receiverUserIsNew) {
    await createAndSendInvitation({
      userId: receiverID,
      phoneNumber: receiverPhoneNumber.substring(0),
      ref: userID,
      message: "You got Flom message! ",
    });
  }

  //await sendUSSDPush({ phoneNumber: receiverPhoneNumber, contextData: `1:${_id.toString()}` });

  return null;
}

async function createAndSendInvitation({ userId, phoneNumber, message, ref }) {
  const slug = Utils.getRandomString(8);

  await RegistrationLink.create({
    userId,
    slug,
    ref,
    phoneNumber,
    shouldSendWelcomeMessage: false,
  });

  const body = `${message} To Login click: ${Config.webClientUrl}/login/${slug}`;
  Utils.sendSMS(phoneNumber, body).catch((error) => {
    console.log(
      `UssdController - Send SMS Error for number ${phoneNumber} with message body ${body}: ${JSON.stringify(
        error,
      )}`,
    );
  });
}

async function sendUSSDPush({ phoneNumber, contextData }) {
  const response = await Utils.sendRequest({
    method: "POST",
    url: Config.ussdPushQrios,
    body: {
      appId: process.env.QRIOS_USSD_APP_ID,
      msisdn: phoneNumber,
      contextData: contextData,
    },
    headers: Config.qriosHeaders,
  });

  console.log({ response });
}

module.exports = router;
