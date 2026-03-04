"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, UserContact, LiveStream } = require("#models");
const mongoose = require("mongoose");

/**
 * @api {get} /api/v2/user/follow Get Followed Businesses
 * @apiVersion 1.0.0
 * @apiName Get Followed Businesses
 * @apiGroup WebAPI User
 * @apiDescription API for getting list of userIds of business that you followed (subscribed to)
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {
 *     "followedBusinesses": [
 *       "5cc80e89c96adb40318d41eb"
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400850 Wrong userId format
 * @apiError (Errors) 4000007 Token not valid
 *
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    let dataToSend = {};
    dataToSend.followedBusinesses = [];

    if (request.user.followedBusinesses)
      dataToSend.followedBusinesses = request.user.followedBusinesses;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("FollowUserController, get followed businesses", e);
      return Base.successResponse(response, Const.responsecodeUserWrongUserIdFormat);
    }
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "FollowUserController, get followed businesses",
      e,
    );
    return;
  }
});

/**
 * @api {get} /api/v2/user/follow/followed Get subscriptions
 * @apiVersion 2.0.8
 * @apiName Get subscriptions
 * @apiGroup WebAPI User
 * @apiDescription New API for getting list of subscriptions (business that you followed). If query page is not present API returns all subscriptions
 * (this is for backwards compatibility), total and hasNext fields won't be present
 *
 * @apiParam (Query string) {String} [page] Page
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631798114221,
 *   "data": {
 *     "followedBusinesses": [
 *       {
 *         "_id": "5f7ee464a283bc433d9d722f",
 *         "name": "+2348*****0007",
 *         "phoneNumber": "+2348020000007",
 *         "bankAccounts": [],
 *         "avatar": {
 *           "picture": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 4698848,
 *             "mimeType": "image/png",
 *             "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *           },
 *           "thumbnail": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 97900,
 *             "mimeType": "image/png",
 *             "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *           }
 *         }
 *       }
 *     ],
 *     "total": 3,
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
 * @apiError (Errors) 400850 Wrong userId format
 * @apiError (Errors) 4000007 Token not valid
 *
 */

router.get("/followed", auth({ allowUser: true }), async function (request, response) {
  try {
    const { followedBusinesses } = request.user;

    let dataToSend = { followedBusinesses: [] };
    const total = followedBusinesses.length;
    let followedBusinessesPaged;

    if (request.query.page) {
      const page = +request.query.page;
      followedBusinessesPaged = followedBusinesses.slice(
        (page - 1) * Const.newPagingRows,
        page * Const.newPagingRows,
      );
      dataToSend["total"] = total;
      dataToSend["hasNext"] = page * Const.newPagingRows < total;
    } else {
      followedBusinessesPaged = followedBusinesses;
    }

    if (total > 0) {
      dataToSend.followedBusinesses = await User.find(
        { _id: { $in: followedBusinessesPaged } },
        {
          _id: 1,
          name: 1,
          username: 1,
          phoneNumber: 1,
          bankAccounts: 1,
          avatar: 1,
        },
      ).lean();
    }

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FollowUserController - get followed (subscribers)",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/user/follow/followers/ Get Followers
 * @apiVersion 1.0.0
 * @apiName Get Followers
 * @apiGroup WebAPI User
 * @apiDescription API for getting the list of users that follow (are subscribed to) you together with list of your contacts
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {
 *     "followers": [
 *       {
 *         "pushToken": [],
 *         "webPushSubscription": [],
 *         "voipPushToken": [],
 *         "_id": "5f11806613c3a91fe32e74c6",
 *         "name": "ndnshs",
 *         "created": 1594982502401,
 *         "phoneNumber": "+385977774088"
 *       },
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400850 Wrong userId format
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/followers", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.user._id.toString();
    let dataToSend = {};
    dataToSend.followers = [];

    let contacts = await UserContact.find({ userId });
    let contactIds = contacts.map((c) => new mongoose.Types.ObjectId(c.contactId));
    let followers = await User.find(
      {
        $or: [{ followedBusinesses: userId }, { _id: { $in: contactIds } }],
        isAppUser: true,
      },
      {
        name: 1,
        phoneNumber: 1,
        pushToken: 1,
        webPushSubscription: 1,
        voipPushToken: 1,
        created: 1,
      },
    ).lean();

    if (followers) dataToSend.followers = followers;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("FollowUserController, get followers", e);
      return Base.successResponse(response, Const.responsecodeUserWrongUserIdFormat);
    }
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "FollowUserController, get followers",
      e,
    );
    return;
  }
});

/**
 * @api {get} /api/v2/user/follow/my-followers Get my subscribers
 * @apiVersion 2.0.8
 * @apiName Get my subscribers
 * @apiGroup WebAPI User
 * @apiDescription API for getting the list of my followers (subscribers). If query page is not present API returns all subscriptions
 * (this is for backwards compatibility), total and hasNext fields won't be present
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [search] Search
 * @apiParam (Query string) {String} [page] Page
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631797739651,
 *   "data": {
 *     "followers": [
 *       {
 *         "_id": "5f7ee96ca283bc433d9d723a",
 *         "name": "tomo",
 *         "phoneNumber": "+385915911306",
 *         "avatar": {
 *           "picture": {
 *             "originalName": "2021-09-16-14-24-48-973.jpg",
 *             "size": 757716,
 *             "mimeType": "image/png",
 *             "nameOnServer": "TTNcsiVxGeJQ7ujbXKnU5TU6M8004ezu"
 *           },
 *           "thumbnail": {
 *             "originalName": "2021-09-16-14-24-48-973.jpg",
 *             "size": 152000,
 *             "mimeType": "image/png",
 *             "nameOnServer": "ShTNFL1aZFuNWzM8l2ijXhD4F1x57hKb"
 *           }
 *         }
 *       },
 *       {
 *         "_id": "5fd0c8043796fc0fdbe5b5b5",
 *         "name": "mosh antigua",
 *         "phoneNumber": "+12687147071"
 *       }
 *     ],
 *     "total": 3,
 *     "hasNext": false
 *   }
 * }
 *
 */

router.get("/my-followers", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.user._id.toString();
    const page = +request.query.page;
    const search = request.query.search;

    const searchQuery = { followedBusinesses: userId };
    if (search && search !== "") {
      searchQuery.name = { $regex: new RegExp(search.toString()), $options: "i" };
    }

    let skip, limit;
    if (page) {
      skip = (page - 1) * Const.newPagingRows;
      limit = Const.newPagingRows;
    }

    const dataToSend = {};
    dataToSend["followers"] = await User.find(searchQuery, {
      _id: 1,
      name: 1,
      username: 1,
      phoneNumber: 1,
      avatar: 1,
    })
      .sort({ created: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (page) {
      const total = await User.find(searchQuery).countDocuments();
      dataToSend["total"] = total;
      dataToSend["hasNext"] = page * Const.newPagingRows < total;
    }

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FollowUserController - get my followers",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/user/follow/add Follow User By Id flom_v1
 * @apiVersion 1.0.0
 * @apiName Follow User By Id flom_v1
 * @apiGroup WebAPI User
 * @apiDescription API for following (subscribing to) user by id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} userId           userId
 * @apiParam {String} [liveStreamId]   liveStreamId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
 * }
 *
 *  @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400810 No userId parameter
 * @apiError (Errors) 400820 User already followed
 * @apiError (Errors) 400850 Wrong userId format
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000760 User not found
 */

router.post("/add", auth({ allowUser: true }), async function (request, response) {
  try {
    const { userId, liveStreamId } = request.body;
    const { user: requestUser } = request;

    if (!userId) return Base.successResponse(response, Const.responsecodeUserNoUserId);

    const user = await User.findOne({ _id: userId }).lean();

    if (!user) {
      return Base.successResponse(response, Const.responsecodeUserNotFound);
    }

    if (user?.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    let followedBusinesses = [];

    if (request.user.followedBusinesses) followedBusinesses = request.user.followedBusinesses;

    // check if product is already liked
    const index = followedBusinesses.indexOf(userId);

    if (index > -1) {
      return Base.successResponse(response, Const.responsecodeUserAlreadyFollowed);
    }

    followedBusinesses.push(userId);

    await User.findByIdAndUpdate(request.user._id, {
      $set: { followedBusinesses: followedBusinesses },
    });

    if (liveStreamId) {
      const liveStream = LiveStream.findById(liveStreamId, { comments: -1 }).lean();

      const dataToSend = {
        messageType: "subscribedToUser",
        liveStreamId,
        userData: {
          _id: requestUser._id.toString(),
          phoneNumber: requestUser.phoneNumber,
          userName: requestUser.userName,
          created: requestUser.created,
          avatar: requestUser.avatar,
        },
      };

      await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });
    }

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("FollowUserController, follow user by id", e);
      return Base.successResponse(response, Const.responsecodeUserWrongUserIdFormat);
    }
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "FollowUserController, follow user by id",
      e,
    );
    return;
  }
});

/**
 * @api {post} /api/v2/user/follow/remove Unfollow User By Id
 * @apiVersion 1.0.0
 * @apiName Unfollow User By Id
 * @apiGroup WebAPI User
 * @apiDescription API for unfollowing (unsubscribing from) user by id
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} userId userId
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400810 No userId parameter
 * @apiError (Errors) 400830 User not followed
 * @apiError (Errors) 400840 User not unfollowed
 * @apiError (Errors) 400850 Wrong userId format
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000760 User not found
 */

router.post("/remove", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.body.userId;

    if (!userId) return Base.successResponse(response, Const.responsecodeUserNoUserId);

    const user = await User.findOne({ _id: userId }).lean();

    if (!user) {
      return Base.successResponse(response, Const.responsecodeUserNotFound);
    }

    if (user.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    let followedBusinesses = [];

    if (request.user.followedBusinesses) followedBusinesses = request.user.followedBusinesses;

    // check if product is already liked
    const index = followedBusinesses.indexOf(userId);

    if (index < 0) {
      return Base.successResponse(response, Const.responsecodeUserNotFollowed);
    }

    const unFollowedUser = followedBusinesses.splice(index, 1);

    if (unFollowedUser === userId) {
      return Base.successResponse(response, Const.responsecodeUserNotUnFollowed);
    }

    await User.findByIdAndUpdate(request.user._id, {
      $set: { followedBusinesses: followedBusinesses },
    });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("FollowUserController, unfollow user by id", e);
      return Base.successResponse(response, Const.responsecodeUserWrongUserIdFormat);
    }
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "FollowUserController, unfollow user by id",
      e,
    );
    return;
  }
});

/**
 * @api {get} /api/v2/user/follow/:userId Get Followed Businesses by userId
 * @apiVersion 1.0.0
 * @apiName Get Followed Businesses by userId
 * @apiGroup WebAPI User
 * @apiDescription Get Followed Businesses by userId
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1540989079012,
 *   "data": {
 *     "followedBusinesses": [
 *       "5cc80e89c96adb40318d41eb"
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400850 Wrong userId format
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:userId", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.params.userId;
    let dataToSend = {};
    dataToSend.followedBusinesses = [];

    const user = User.findById(userId);

    if (user.followedBusinesses) dataToSend.followedBusinesses = user.followedBusinesses;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("FollowUserController, followed businesses by userid", e);
      return Base.successResponse(response, Const.responsecodeUserWrongUserIdFormat);
    }
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "FollowUserController, followed businesses by userid",
      e,
    );
    return;
  }
});

module.exports = router;
