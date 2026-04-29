"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, LiveStream, Notification, Tribe, Transfer } = require("#models");
const { socketApi } = require("#sockets");
const { recombee } = require("#services");

/**
 * @api {post} /api/v2/livestreams/start Start live stream flom_v1
 * @apiVersion 2.0.23
 * @apiName Start live stream
 * @apiGroup WebAPI Live Stream
 * @apiDescription API that starts live stream and sends notifications to subscribers, members and cohosts
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}  liveStreamId  Live stream id
 *
 * @apiSuccessExample Success-Response:
 * {
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443863 Invalid live stream id
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not stream owner
 * @apiError (Errors) 443875 Live stream already started
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/start", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();

    const { liveStreamId } = request.body;

    if (!liveStreamId || !Utils.isValidObjectId(liveStreamId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `StartLiveStreamController, invalid liveStreamId: ${liveStreamId}`,
      });
    }

    const liveStream = await LiveStream.findOne({ _id: liveStreamId }, { comments: 0 }).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: `StartLiveStreamController, live stream not found: ${liveStreamId}`,
      });
    }

    if (liveStream.userId !== userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: `StartLiveStreamController, user not stream owner: ${userId}`,
      });
    }

    if (liveStream.startTimeStamp) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamAlreadyStarted,
        message: `StartLiveStreamController, live stream already started: ${liveStreamId}`,
      });
    }

    const updatedLiveStream = await LiveStream.findByIdAndUpdate(
      liveStreamId,
      { startTimeStamp: Date.now(), modified: Date.now(), isActive: true },
      { new: true, lean: true },
    );

    const deadStreams = await LiveStream.find({
      userId,
      _id: { $ne: liveStreamId },
      isActive: true,
    }).lean();
    await LiveStream.updateMany(
      { userId, _id: { $ne: liveStreamId }, isActive: true },
      { endTimeStamp: Date.now(), modified: Date.now(), isActive: false },
    );
    await recombee.deactivateLiveStreams({ liveStreams: deadStreams || [] });

    socketApi.emitAll("userStartedStreaming", {
      userId,
      liveStreamId,
    });

    await Logics.formatLiveStreamResponse({ liveStream: updatedLiveStream });

    const responseData = { updatedLiveStream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      await recombee.upsertLiveStream({ liveStream: updatedLiveStream });
    } catch (error) {
      logger.error("StartLiveStreamController, recombee error: ", error);
    }

    try {
      const dataToSend = {
        messageType: "streamUpdated",
        liveStreamId,
        streamData: updatedLiveStream,
      };
      await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });

      const {
        chatReceivers = [],
        pushTokens = [],
        notificationListReceiversIds = [],
        whatsAppReceivers = [],
      } = await getNotificationReceivers({ liveStream: updatedLiveStream, user });

      const notificationInfos = [];

      for (const receiverId of notificationListReceiversIds) {
        notificationInfos.push({
          title: `New live stream`,
          text: `${user.userName} is live: ${liveStream.name}`,
          receiverIds: receiverId,
          senderId: userId,
          referenceId: liveStreamId,
          notificationType: Const.notificationTypeNewLiveStream,
        });
      }

      if (notificationInfos.length > 0) {
        await Notification.create(notificationInfos);
      }

      for (const receiver of chatReceivers) {
        let roomId = "";

        if (user.created < receiver.created) {
          roomId = `1-${userId}-${receiver?._id.toString()}`;
        } else {
          roomId = `1-${receiver?._id.toString()}-${userId}`;
        }

        const messageToSend = {
          roomID: roomId,
          message: `${user.userName} is live: ${liveStream.name}`,
          type: Const.messageTypeNewLiveStream,
          attributes: { liveStream: updatedLiveStream },
        };

        await Utils.sendMessageToChat({
          messageData: messageToSend,
          senderToken: user.token[0].token,
        });
      }

      if (pushTokens.length > 0) {
        await Utils.sendPushNotifications({
          pushTokens,
          pushType: Const.pushTypeNewLiveStream,
          info: {
            title: `${user.userName} is live: ${liveStream.name}`,
            liveStream: updatedLiveStream,
          },
        });
      }

      if (whatsAppReceivers.length > 0) {
        const prices = await Logics.getWhatsAppPrices({ countryCode: user.countryCode });
        const marketing = prices ? prices.marketing : null;

        if (marketing) {
          const price = marketing * whatsAppReceivers.length;

          if (user.satsBalance < price) {
            logger.warn(
              `StartLiveStreamController, not sending WhatsApp messages, insufficient balance. userId: ${userId}, balance: ${user.satsBalance}, required: ${price}`,
            );
            // TODO: whatsapp log
          } else {
            let i = 0,
              realPrice = 0;

            for (const receiver of whatsAppReceivers) {
              const wamid = await Utils.sendWhatsAppMessage({
                to: receiver.phoneNumber,
                template: "goLive",
                userName: user.userName,
                liveStreamId,
              });

              if (wamid) {
                realPrice += marketing;
              } else {
                logger.error(
                  `StartLiveStreamController, failed to send WhatsApp message to userId: ${receiver._id.toString()}, phoneNumber: ${
                    receiver.phoneNumber
                  }`,
                );
              }

              i++;

              if (i % 5 === 0) {
                await Utils.wait(0.1); // Adding delay to avoid hitting rate limits
              }
            }

            await Logics.makeFeeTransfer({
              fee: realPrice,
              feeType: "Live stream notification",
              sender: user,
              numberOfWaMessages: whatsAppReceivers.length,
            });
          }
        } else {
          logger.error(
            `StartLiveStreamController, not sending WhatsApp messages, marketing price not found for country code: ${user.countryCode}`,
          );
        }
      }
    } catch (error) {
      logger.error("StartLiveStreamController, messages", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "StartLiveStreamController",
      error,
    });
  }
});

async function getNotificationReceivers({ liveStream, user }) {
  const { visibility, tribeIds, communityIds, cohosts: cohostIds = [] } = liveStream;
  const userId = user._id.toString();

  let chatReceivers = [],
    pushTokens = [],
    notificationListReceiversIds = [];

  if (visibility === "public") {
    const followers = await User.find({
      followedBusinesses: userId,
      "isDeleted.value": false,
    }).lean();

    for (const follower of followers) {
      const id = follower._id.toString();

      if (follower.pushToken && !cohostIds.includes(id)) {
        pushTokens.push(...follower.pushToken);

        notificationListReceiversIds.push(id);
      }
    }
  }

  if (visibility === "tribes") {
    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();
    let memberIds = [];

    for (const tribe of tribes) {
      const {
        members: { accepted },
      } = tribe;

      for (const member of accepted) {
        if (member.id && !cohostIds.includes(member.id)) {
          memberIds.push(member.id);

          notificationListReceiversIds.push(member.id);
        }
      }
    }

    chatReceivers = await User.find({ _id: { $in: memberIds }, "isDeleted.value": false }).lean();

    for (const receiver of chatReceivers) {
      if (receiver.pushToken) {
        pushTokens.push(...receiver.pushToken);
      }
    }
  }

  if (visibility === "community") {
    chatReceivers = await User.find({
      _id: { $nin: cohostIds },
      "memberships.id": { $in: communityIds },
      "isDeleted.value": false,
    }).lean();

    for (const receiver of chatReceivers) {
      if (receiver.pushToken) {
        pushTokens.push(...receiver.pushToken);
      }

      notificationListReceiversIds.push(receiver._id.toString());
    }
  }

  if (cohostIds.length > 0) {
    const cohosts = await User.find({ _id: { $in: cohostIds }, "isDeleted.value": false }).lean();

    for (const cohost of cohosts) {
      if (cohost.pushToken) {
        pushTokens.push(...cohost.pushToken);
      }

      chatReceivers.push(cohost);
      notificationListReceiversIds.push(cohost._id.toString());
    }
  }

  const whatsAppReceivers = !user.notificationOptions?.whatsApp?.enabled
    ? []
    : !user.notificationOptions?.whatsApp?.goLive
    ? []
    : await User.find({
        "isDeleted.value": false,
        "whatsApp.subscriptions": userId,
      }).lean();

  return { chatReceivers, pushTokens, notificationListReceiversIds, whatsAppReceivers };
}

module.exports = router;
