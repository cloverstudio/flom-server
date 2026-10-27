"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { MarketingNotification, User } = require("#models");
const {
  validateMarketingNotificationData,
  getSubscribers,
  validateData,
  sendWhatsAppMessages,
  getServiceNotificationCountAndMarketingPrice,
} = require("../helpers");
const { WhatsApp: W } = require("#services");

/**
 * @api {post} /api/v2/marketing-notifications/send Send marketing notification
 * @apiVersion 2.0.35
 * @apiName Send marketing notification
 * @apiGroup WebAPI Marketing Notification
 * @apiDescription API for sending a marketing notification
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}   title             Notification title
 * @apiParam {String}   [text]            Notification text
 * @apiParam {String}   [voiceNoteId]     Notification voice note file id
 * @apiParam {String[]} [subscriberIds]   List of userIds to who to send the notification. Array of strings.
 * @apiParam {Number}   [allSubscribers]  Flag indicating whether to send the notification to all subscribers. 1 for yes, 0 for no.
 * @apiParam {Number}   contentType       Type of the content: 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product, 6 - profile, 7 - marketplace, 8 - service
 * @apiParam {String}   [contentId]       Id of the content. Required only for content type from 1 to 5
 * @apiParam {String[]} channels          List of channels to send the notification through. Array of strings. (e.g., ["whatsapp", "sms" ])
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635925162110,
 *   "data": {
 *     "marketingNotification": {
 *       "receivers": [
 *         "5f7ee96ca283bc433d9d723a",
 *         "5fd0c8043796fc0fdbe5b5b5",
 *         "6101140dcbf8f756d06168fd",
 *         "6139cd7848c6c40f4dffb04a"
 *       ],
 *       "created": 1635924986184,
 *       "_id": "61823caa33b1083a21fc68f0",
 *       "title": "Test title",
 *       "text": "Test text",
 *       "senderId": "5f7ee464a283bc433d9d722f",
 *       "allSubscribers": 1,
 *       "contentType": 1,
 *       "contentId": "616ec172b752ad6dd2458987",
 *       "contentName": "Test",
 *       "voiceNote": {
 *         "_id": "671107333faac76859bf7466",
 *         "name": "aMwATKCRJ2mCZxT0LnMb4E40eSusVxtI.mp3",
 *         "created": 1729169203445,
 *         "duration": 200.646531,
 *         "mimeType": "audio/mpeg",
 *         "size": 3213130
 *       },
 *       "channels": [
 *         "whatsapp",
 *         "sms"
 *       ]
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Push notification
 * {
 *   "pushType": 750,
 *   "info": {
 *     "marketingNotificationId": "61823caa33b1083a21fc68f0",
 *     "title": "Test title",
 *     "text": "Test text",
 *     "contentType": 1,
 *     "contentName": "Test",
 *     "voiceNote": {
 *       "_id": "671107333faac76859bf7466",
 *       "name": "aMwATKCRJ2mCZxT0LnMb4E40eSusVxtI.mp3",
 *       "created": 1729169203445,
 *       "duration": 200.646531,
 *       "mimeType": "audio/mpeg",
 *       "size": 3213130
 *     },
 *     "from": {
 *       "id": "61823caa33b1083a21fc68f0",
 *       "name": "Name",
 *       "created": 1635924986184,
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1Z9IDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52el9inZOQ20yNn2PpnMwi"
 *         }
 *       },
 *       "phoneNumber": "+23444444444",
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400160 Product not found (either wrong contentId or you are not the owner of the product)
 * @apiError (Errors) 443405 No title parameter
 * @apiError (Errors) 443408 No contentType parameter
 * @apiError (Errors) 443409 Wrong contentType parameter
 * @apiError (Errors) 443410 No contentId parameter
 * @apiError (Errors) 443411 Invalid contentId parameter
 * @apiError (Errors) 444012 Invalid voiceNoteId parameter
 * @apiError (Errors) 443391 Voice note not found
 * @apiError (Errors) 443407 subscriberIds is empty
 * @apiError (Errors) 4000133 Global balance too low
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/send", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const requestUserId = user._id.toString();
    const { title, text, voiceNoteId, channels = ["flom"] } = request.body;
    let subscriberIds = request.body.subscriberIds || [];
    subscriberIds = subscriberIds.map((id) => id.trim());
    const contentType = +request.body.contentType;
    const allSubscribers = !request.body.allSubscribers ? 0 : +request.body.allSubscribers;
    if (!channels.includes("flom")) {
      channels.push("flom");
    }

    if (!allSubscribers && subscriberIds.length === 0) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeUserIdsEmpty,
        message: `MarketingNotificationsController - send notification, empty subscriberIds parameter`,
      });
    }

    const { rawSubscribers: subscribers } = await getSubscribers({
      userId: requestUserId,
      subscriberIds,
      allSubscribers: !!allSubscribers,
    });

    const { code, message, contentId, contentName, voiceNote } = await validateData({
      requestUserId,
      title,
      contentType,
      requestContentId: request.body.contentId,
      voiceNoteId,
    });

    if (code) {
      return Base.errorResponse({
        response,
        code,
        message: `MarketingNotificationsController - send notification, ${message}`,
      });
    }

    const marketingNotification = await MarketingNotification.create({
      title,
      text,
      senderId: requestUserId,
      contentType,
      contentId,
      contentName,
      voiceNote,
      channels,
      receivers: subscribers.map((s) => s._id.toString()),
    });

    const marketingNotificationObj = marketingNotification.toObject();
    delete marketingNotificationObj.__v;

    const waSubscribers = subscribers.filter((s) => !s.inApp);
    const pushSubscribers = subscribers.filter((s) => s.inApp);

    let sendServiceMessages = true;

    if (waSubscribers.length > 0) {
      const { serviceMessagesCount: serviceNotificationCount, priceInSats } =
        await getServiceNotificationCountAndMarketingPrice({
          subscribers: waSubscribers,
          notification: marketingNotificationObj,
          user,
        });
      const serviceMessagesCount = await W.getServiceMessagesCount();

      if (serviceNotificationCount + serviceMessagesCount >= 1000) {
        sendServiceMessages = false;
      }

      if (priceInSats > user.satsBalance) {
        return Base.errorResponse({
          response,
          code: Const.resCodeAuctionGlobalBalanceTooLow,
          message: `MarketingNotificationsController - send notification, global balance too low`,
        });
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      marketingNotification: marketingNotificationObj,
    });

    try {
      await User.findByIdAndUpdate(requestUserId, {
        lastUsedMarketingNotificationChannels: channels,
      });

      const marketingNotificationId = marketingNotificationObj._id.toString();
      const from = {
        id: requestUserId,
        name: user.name,
        created: user.created,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
      };

      if (pushSubscribers.length > 0) {
        for (const s of pushSubscribers) {
          const userPushTokens = s.pushToken || [];

          for (const t of userPushTokens) {
            await Utils.callPushService({
              pushToken: t,
              isVoip: false,
              unreadCount: 1,
              isMuted: false,
              payload: {
                pushType: Const.pushTypeMarketingNotification,
                info: {
                  marketingNotificationId,
                  title,
                  text,
                  contentType,
                  contentName,
                  voiceNote,
                  from,
                },
              },
            });
          }
        }
      }

      if (Config.environment === "production" && waSubscribers.length > 0) {
        await sendWhatsAppMessages({
          subscribers: waSubscribers,
          notification: marketingNotificationObj,
          user,
          sendServiceMessages,
        });
      }

      await User.updateMany(
        { _id: { $in: subscriberIds } },
        { $inc: { "notifications.unreadCount": 1 } },
      );
    } catch (error) {
      logger.error(
        "MarketingNotificationsController - send notification, error updating user and sending messages",
        error,
      );
    }
  } catch (error) {
    Base.errorResponse({
      response,
      message: "MarketingNotificationsController - send notification",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/marketing-notifications/subscribers Get list of subscribers
 * @apiVersion 2.0.35
 * @apiName Get list of subscribers
 * @apiGroup WebAPI Marketing Notification
 * @apiDescription API for retrieving the list of subscribers for a user. Response has example of a native Flom user and a shadow user. Shadow user's username (Flomer_userId) has been replaced with phone number.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page]    Page (default is 1)
 * @apiParam (Query string) {String} [size]    Page size (default is 10)
 * @apiParam (Query string) {String} [search]  Search term to filter usernames or phonenumbers (case insensitive)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1792037052957,
 *     "data": {
 *         "subscribers": [
 *             {
 *                 "_id": "64522d0ce8032549d6f9abba",
 *                 "phoneNumber": "+2348020000003",
 *                 "avatar": {
 *                     "picture": {
 *                         "originalName": "imageA_1789455454.jpg",
 *                         "size": 2801456,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "VrIxdnuOWpHOpQ0PQBvpc4fhsdy3QVOd"
 *                     },
 *                     "thumbnail": {
 *                         "originalName": "imageA_1789455454.jpg",
 *                         "size": 119241,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "CxErV1Vo6Lpq2nJyCnQh20xZXXDEECtw"
 *                     }
 *                 },
 *                 "userName": "flom3",
 *                 "channels": {
 *                     "flom": true
 *                 }
 *             },
 *             {
 *                 "_id": "654b64d0784c4579ed0cf752",
 *                 "phoneNumber": "+385915913065",
 *                 "userName": "+385915913065",
 *                 "channels": {
 *                     "whatsapp": true,
 *                     "whatsappType": "paid" // "paid" or "free" depending on the user's WhatsApp window status
 *                 }
 *             },
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "size": 10,
 *             "total": 2
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/subscribers", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();

    const { page: p = 1, size: s = 10, search = null } = request.query;
    const page = +p;
    const size = +s;

    const { subscribers, subscriberCount } = await getSubscribers({
      userId,
      page,
      size,
      search,
      allSubscribers: true,
    });

    const paginationData = {
      page,
      size,
      total: subscriberCount,
    };

    Base.successResponse(response, Const.responsecodeSucceed, { subscribers, paginationData });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "MarketingNotificationsController - get subscribers",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/marketing-notifications/cost Calculate cost of marketing notification
 * @apiVersion 2.0.35
 * @apiName Calculate cost of marketing notification
 * @apiGroup WebAPI Marketing Notification
 * @apiDescription API for calculating the cost of a marketing notification. Flom is included as only a number because flom's notifications are always free. If notification has no text, paid messages will not be sent.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String[]} [subscriberIds]   List of subscriber IDs to whom the marketing notification will be sent.
 * @apiParam {Number}   [allSubscribers]  Flag indicating whether to calculate for all subscribers. 1 for yes, 0 for no.
 * @apiParam {Number}   hasText           Flag indicating whether the marketing notification has text content. 1 for yes, 0 for no. If not provided, defaults to 0.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1792038144318,
 *     "data": {
 *         "flom": 5,
 *         "whatsapp": {
 *             "free": 0,
 *             "paid": 1,
 *             "paidExcluded": 0,
 *             "priceInSats": 100,
 *             "priceInUsd": 0.09,
 *             "priceInUsersCurrency": 64.5,
 *             "usersCurrency": "NGN"
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443407 subscriberIds is empty
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/cost", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { subscriberIds = [] } = request.body;
    const allSubscribers = !request.body.allSubscribers ? 0 : +request.body.allSubscribers;
    const hasText = !request.body.hasText ? 0 : +request.body.hasText;

    if (!allSubscribers && subscriberIds.length === 0) {
      return Base.errorResponse({
        response,
        code: Const.responsecodeUserIdsEmpty,
        message: `MarketingNotificationsController - calculate cost, empty subscriberIds parameter`,
      });
    }

    const { rawSubscribers: subscribers } = await getSubscribers({
      userId,
      subscriberIds,
      allSubscribers: !!allSubscribers,
    });

    const userCountryCode =
      user.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });
    const priceMap = await W.getPriceMap(userCountryCode);
    const localCurrency = priceMap.localCurrency;
    let priceInSats = 0,
      priceInLocalCurrency = 0,
      flom = 0,
      free = 0,
      paid = 0,
      paidExcluded = 0,
      priceInUsd = 0;

    for (const s of subscribers) {
      if (s.hasLoggedIn == Const.userLoggedInAtLeastOnce) {
        flom++;
        continue;
      }

      if (s.whatsApp?.windowExpiresAt && s.whatsApp.windowExpiresAt > Date.now()) {
        free++;
        continue;
      }

      const subscriberCountryCode =
        s.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: s.phoneNumber });

      if (
        !subscriberCountryCode ||
        !priceMap[subscriberCountryCode] ||
        !priceMap[subscriberCountryCode].marketingUsd
      ) {
        logger.warn(
          `MarketingNotificationsController - calculate cost, no marketing price for subscriber country code: ${subscriberCountryCode}`,
        );
        continue;
      }

      if (!hasText) {
        paidExcluded++;
        continue;
      }

      paid++;
      priceInUsd += priceMap[subscriberCountryCode].marketingUsd;
      priceInSats += priceMap[subscriberCountryCode].marketing;
      priceInLocalCurrency += priceMap[subscriberCountryCode].marketingLocal;
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      flom,
      whatsapp: {
        free,
        paid,
        paidExcluded,
        priceInSats,
        priceInUsd,
        priceInUsersCurrency: priceInLocalCurrency,
        usersCurrency: localCurrency,
      },
    });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "MarketingNotificationsController - calculate cost",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/marketing-notifications Add new marketing notification
 * @apiVersion 2.0.9
 * @apiName Add new marketing notification
 * @apiGroup WebAPI Marketing Notification
 * @apiDescription API for creating new marketing notification
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} title Marketing notification title
 * @apiParam {String} [text] Marketing notification text
 * @apiParam {String} [userIds] List of userIds to who to send the notification separated by a comma. Optional if allSubscribers is 1
 * @apiParam {Number} [allSubscribers] 0 - false, 1 - true. If it is 1 then notification will be sent to all subscribers of the request sender.
 * Moreover, userIds will be ignored if this parameter is set to 1
 * @apiParam {Number} contentType Type of the content: 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product, 6 - profile, 7 - marketplace, 8 - service
 * @apiParam {String} [contentId] Id of the content. Required only for content type from 1 to 5
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635925162110,
 *   "data": {
 *     "marketingNotification": {
 *       "receivers": [
 *         "5f7ee96ca283bc433d9d723a",
 *         "5fd0c8043796fc0fdbe5b5b5",
 *         "6101140dcbf8f756d06168fd",
 *         "6139cd7848c6c40f4dffb04a"
 *       ],
 *       "created": 1635924986184,
 *       "_id": "61823caa33b1083a21fc68f0",
 *       "title": "Test title",
 *       "text": "Test text",
 *       "senderId": "5f7ee464a283bc433d9d722f",
 *       "allSubscribers": 1,
 *       "contentType": 1,
 *       "contentId": "616ec172b752ad6dd2458987",
 *       "contentName": "Test"
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Push notification
 * {
 *   "pushType": 750,
 *   "info": {
 *     "marketingNotificationId": "61823caa33b1083a21fc68f0",
 *     "title": "Test title",
 *     "text": "Test text",
 *     "contentType": 1,
 *     "contentName": "Test"
 *     "from": {
 *       "id": "61823caa33b1083a21fc68f0",
 *       "name": "Name",
 *       "created": 1635924986184,
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1Z9IDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52el9inZOQ20yNn2PpnMwi"
 *         }
 *       },
 *       "phoneNumber": "+23444444444",
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400160 Product not found (either wrong contentId or you are not the owner of the product)
 * @apiError (Errors) 443405 No title parameter
 * @apiError (Errors) 443406 No userIds parameter
 * @apiError (Errors) 443407 userIds is empty (1 - you didn't send any valid userId of your subscribers, 2 - you
 * want to send notification to allSubscribers but you dont have any subscribers
 * @apiError (Errors) 443408 No contentType parameter
 * @apiError (Errors) 443409 Wrong contentType parameter
 * @apiError (Errors) 443410 No contentId parameter
 * @apiError (Errors) 443411 Invalid contentId parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const requestUserId = user._id.toString();
    const { title, text } = request.body;
    const contentType = +request.body.contentType;
    const allSubscribers = !!+request.body.allSubscribers;

    const { code, message, userIds, userPushTokens, contentId, contentName } =
      await validateMarketingNotificationData({
        requestUserId,
        title,
        allSubscribers,
        requestUserIds: request.body.userIds,
        contentType,
        requestContentId: request.body.contentId,
      });

    if (code) {
      return Base.errorResponse({
        response,
        code,
        message: `MarketingNotificationsController - add notification, ${message}`,
      });
    }

    const marketingNotification = await MarketingNotification.create({
      title,
      text,
      senderId: requestUserId,
      allSubscribers,
      receivers: userIds,
      contentType,
      contentId,
      contentName,
    });

    const marketingNotificationObj = marketingNotification.toObject();
    delete marketingNotificationObj.__v;

    Base.successResponse(response, Const.responsecodeSucceed, {
      marketingNotification: marketingNotificationObj,
    });

    const marketingNotificationId = marketingNotificationObj._id.toString();
    const from = {
      id: requestUserId,
      name: user.name,
      created: user.created,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
    };

    for (let i = 0; i < userPushTokens.length; i++) {
      await Utils.callPushService({
        pushToken: userPushTokens[i],
        isVoip: false,
        unreadCount: 1,
        isMuted: false,
        payload: {
          pushType: Const.pushTypeMarketingNotification,
          info: {
            marketingNotificationId,
            title,
            text,
            contentType,
            contentName,
            from,
          },
        },
      });
    }

    await User.updateMany({ _id: { $in: userIds } }, { $inc: { "notifications.unreadCount": 1 } });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "MarketingNotificationsController - add new notification",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/marketing-notifications/:marketingNotificationId Get marketing notification details
 * @apiVersion 2.0.9
 * @apiName Get marketing notification details
 * @apiGroup WebAPI Marketing Notification
 * @apiDescription API for getting details of the marketing notification. NOTE! if allSubscribers is 0 then response will have nothing
 * receivers array of receiving user ids.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635940148429,
 *   "data": {
 *     "marketingNotification": {
 *       "_id": "618274d71e3d06bc49c137cd",
 *       "title": "Test title4",
 *       "allSubscribers": 1, // if this is 0 then response will have receivers array
 *       "contentType": 1,
 *       "contentId": "616ec172b752ad6dd2458987",
 *       "contentName": "Test",
 *       "voiceNote": {
 *         "_id": "671107333faac76859bf7466",
 *         "name": "aMwATKCRJ2mCZxT0LnMb4E40eSusVxtI.mp3",
 *         "created": 1729169203445,
 *         "duration": 200.646531,
 *         "mimeType": "audio/mpeg",
 *         "size": 3213130
 *       }
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443411 Invalid marketingNotificationId parameter
 * @apiError (Errors) 443412 Marketing notification not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/:marketingNotificationId",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const requestUserId = request.user._id.toString();
      const { marketingNotificationId } = request.params;

      if (!Utils.isValidObjectId(marketingNotificationId)) {
        return Base.errorResponse({
          response,
          code: Const.responsecodeInvalidObjectId,
          message: `MarketingNotificationsController - get notification, marketingNotificationId is not valid`,
        });
      }

      const marketingNotification = await MarketingNotification.findOne(
        { _id: marketingNotificationId, senderId: requestUserId },
        {
          title: 1,
          text: 1,
          receivers: 1,
          allSubscribers: 1,
          contentType: 1,
          contentId: 1,
          contentName: 1,
          voiceNote: 1,
        },
      ).lean();

      if (!marketingNotification) {
        return Base.errorResponse({
          response,
          code: Const.responsecodeMarketingNotificationNotFound,
          message: `MarketingNotificationsController - get notification, notification not found`,
        });
      }

      if (marketingNotification.allSubscribers) {
        delete marketingNotification.receivers;
      }
      delete marketingNotification.__v;

      Base.successResponse(response, Const.responsecodeSucceed, { marketingNotification });
    } catch (error) {
      Base.errorResponse({
        response,
        message: "MarketingNotificationsController - get notification",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/marketing-notifications Get my marketing notification list
 * @apiVersion 2.0.9
 * @apiName Get my marketing notification list
 * @apiGroup WebAPI Marketing Notification
 * @apiDescription API for getting list of marketing notifications you sent out.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [search] Search text to search marketing notification titles
 * @apiParam (Query string) {String} [page] Page
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635936424041,
 *   "data": {
 *     "marketingNotifications": [
 *       {
 *         "_id": "618265cf31379e9cf6b812d0",
 *         "created": 1635935691743,
 *         "title": "Test title",
 *         "text": "text",
 *         "contentType": 1,
 *         "contentName": "Test",
 *         "voiceNote": {
 *           "_id": "671107333faac76859bf7466",
 *           "name": "aMwATKCRJ2mCZxT0LnMb4E40eSusVxtI.mp3",
 *           "created": 1729169203445,
 *           "duration": 200.646531,
 *           "mimeType": "audio/mpeg",
 *           "size": 3213130
 *         },
 *       },
 *     ],
 *     "total": 1,
 *     "hasNext": false
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const requestUserId = request.user._id.toString();
    const search = request.query.search;
    const page = +request.query.page || 1;

    const searchQuery = { senderId: requestUserId };
    if (search && search !== "") {
      searchQuery["title"] = { $regex: new RegExp(search.toString()), $options: "i" };
    }

    const sortQuery = search && search !== "" ? { $score: 1 } : { created: -1 };

    const marketingNotifications = await MarketingNotification.find(searchQuery, {
      _id: 1,
      title: 1,
      text: 1,
      created: 1,
      contentType: 1,
      contentName: 1,
      voiceNote: 1,
    })
      .sort(sortQuery)
      .skip((page - 1) * Const.newPagingRows)
      .limit(Const.newPagingRows)
      .lean();

    const total = await MarketingNotification.find(searchQuery).countDocuments();

    const marketingNotificationsFormatted = marketingNotifications.map((x) => {
      const { __v, ...rest } = x;
      return rest;
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      marketingNotifications: marketingNotificationsFormatted,
      total,
      hasNext: page * Const.newPagingRows < total,
    });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "MarketingNotificationsController - notification list",
      error,
    });
  }
});

module.exports = router;
