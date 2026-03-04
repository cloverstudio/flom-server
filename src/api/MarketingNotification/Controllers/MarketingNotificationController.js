"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { MarketingNotification, User } = require("#models");
const { validateMarketingNotificationData } = require("../helpers");

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
 * @apiParam {Number} contentType Type of the content: 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product, 6 - profile, 7 - marketplace
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
      return Base.newErrorResponse({
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
    Base.newErrorResponse({
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
 *       "contentName": "Test"
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
        return Base.newErrorResponse({
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
        },
      ).lean();

      if (!marketingNotification) {
        return Base.newErrorResponse({
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
      Base.newErrorResponse({
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
 *         "contentName": "Test"
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
    Base.newErrorResponse({
      response,
      message: "MarketingNotificationsController - notification list",
      error,
    });
  }
});

module.exports = router;
