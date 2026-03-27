"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const { Group, User, UserContact, Room, History, FlomMessage } = require("#models");
const { getUsersOnlineStatus, totalUnreadCount } = require("#logics");

/**
 * @api {get} /api/v2/user/history/search Search users histories flom_v1
 * @apiVersion 2.0.27
 * @apiName  Search users histories flom_v1
 * @apiGroup WebAPI User
 * @apiDescription  Search users histories.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} [page]  Page number (size is 10), default: 1
 * @apiParam (Query string) {String} query   Search query
 *
 * @apiSuccessExample Success Response
 * {
 *     histories api response
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/search", auth({ allowUser: true }), async function (request, response) {
  try {
    const { page: p, query } = request.query;
    const page = !p ? 1 : +p;

    if (!query) {
      return Base.successResponse(response, Const.responsecodeSucceed, { list: [] });
    }

    const res = await getList(0, -1, request, { page, query });

    return Base.successResponse(response, Const.responsecodeSucceed, res);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "HistoryListController search error",
      error,
    );
  }
});

/**
      * @api {get} /api/v2/user/history/:page historylist
      * @apiName History List
      * @apiGroup WebAPI
      * @apiDescription Returns user histoy
      * @apiHeader {String} access-token Users unique access-token.
      * @apiSuccessExample Success-Response:
 
 {
     "code": 1,
     "time": 1458058376999,
     "data": {
         "list": [{
             "_id": "56e83466e804ad952eb49863",
             "userId": "56e6b6d206552124125cdb86",
             "chatId": "56dee3091f9b351bcd4e546a",
             "chatType": 2,
             "lastUpdate": 1458058343838,
             "lastUpdateUser": {
                 "_id": "56c32acd331dd81f8134f200",
                 "name": "Ken",
                 "sortName": "ken yasue",
                 "description": "ああああ",
                 "userid": "kenyasue",
                 "password": "*****",
                 "created": 1455631053660,
                 "status": 1,
                 "organizationId": "56ab7b9061b760d9eb6feba3",
                 "__v": 0,
                 "tokenGeneratedAt": 1458058317218,
                 "token": "*****",
                 "groups": ["56e7ef842500caf2eda5d5fb", "56e7da1671be6b38d3beb967", "56dee2fd1f9b351bcd4e5469"],
                 "avatar": {
                     "thumbnail": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
                     },
                     "picture": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
                     }
                 }
             },
             "lastMessage": {
                 "type": 1,
                 "created": 1458058343831,
                 "message": "4"
             },
             "unreadCount": 4,
             "__v": 0,
             "group": {
                 "_id": "56dee3091f9b351bcd4e546a",
                 "name": "Developers",
                 "sortName": "developers",
                 "description": "",
                 "created": 1457447689335,
                 "organizationId": "56ab7b9061b760d9eb6feba3",
                 "parentId": "56dee2fd1f9b351bcd4e5469",
                 "type": 2,
                 "__v": 0,
                 "users": ["56e6b6d706552124125cdb87", "56e6b71106552124125cdb8c", "56e6b71306552124125cdb8d", "56e6b71f06552124125cdb8e", "56e6b72806552124125cdb8f", "56e6b73206552124125cdb90", "56e6b73706552124125cdb91", "56e6b73d06552124125cdb92", "56e6b6d206552124125cdb86"],
                 "usersCount": 9,
                 "userModels": [{
                     "_id": "56e6b6d206552124125cdb86",
                     "name": "user1",
                     "sortName": "user1",
                     "description": "user1",
                     "userid": "testuser1",
                     "password": "*****",
                     "created": 1457960658915,
                     "status": 1,
                     "organizationId": "56ab7b9061b760d9eb6feba3",
                     "__v": 0,
                     "tokenGeneratedAt": 1458058365344,
                     "token": "*****",
                     "groups": ["56e7da1671be6b38d3beb967", "56dee3091f9b351bcd4e546a"]
                 }, {
                     "_id": "56e6b6d706552124125cdb87",
                     "name": "user2",
                     "sortName": "user2",
                     "description": "user1",
                     "userid": "testuser2",
                     "password": "*****",
                     "created": 1457960663961,
                     "status": 1,
                     "organizationId": "56ab7b9061b760d9eb6feba3",
                     "__v": 0,
                     "groups": ["56dee3091f9b351bcd4e546a"]
                 }, {
                     "_id": "56e6b71106552124125cdb8c",
                     "name": "user3",
                     "sortName": "user3",
                     "description": "",
                     "userid": "testuser3",
                     "password": "*****",
                     "created": 1457960721257,
                     "status": 1,
                     "organizationId": "56ab7b9061b760d9eb6feba3",
                     "__v": 0,
                     "groups": ["56dee3091f9b351bcd4e546a"]
                 }, {
                     "_id": "56e6b71306552124125cdb8d",
                     "name": "user4",
                     "sortName": "user4",
                     "description": "",
                     "userid": "testuser4",
                     "password": "*****",
                     "created": 1457960723968,
                     "status": 1,
                     "organizationId": "56ab7b9061b760d9eb6feba3",
                     "__v": 0,
                     "groups": ["56dee3091f9b351bcd4e546a"]
                 }, {
                     "_id": "56e6b71f06552124125cdb8e",
                     "name": "user6",
                     "sortName": "user6",
                     "description": "",
                     "userid": "testuser6",
                     "password": "*****",
                     "created": 1457960735226,
                     "status": 1,
                     "organizationId": "56ab7b9061b760d9eb6feba3",
                     "__v": 0,
                     "groups": ["56dee3091f9b351bcd4e546a"]
                 }]
             }
         }, {
             "_id": "56e83451e804ad952eb49857",
             "userId": "56e6b6d206552124125cdb86",
             "chatId": "56e7da1671be6b38d3beb967",
             "chatType": 2,
             "lastUpdate": 1458058322044,
             "lastUpdateUser": {
                 "_id": "56c32acd331dd81f8134f200",
                 "name": "Ken",
                 "sortName": "ken yasue",
                 "description": "ああああ",
                 "userid": "kenyasue",
                 "password": "*****",
                 "created": 1455631053660,
                 "status": 1,
                 "organizationId": "56ab7b9061b760d9eb6feba3",
                 "__v": 0,
                 "tokenGeneratedAt": 1458058317218,
                 "token": "*****",
                 "groups": ["56e7ef842500caf2eda5d5fb", "56e7da1671be6b38d3beb967", "56dee2fd1f9b351bcd4e5469"],
                 "avatar": {
                     "thumbnail": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
                     },
                     "picture": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
                     }
                 }
             },
             "lastMessage": {
                 "type": 1,
                 "created": 1458058322036,
                 "message": "d"
             },
             "unreadCount": 3,
             "__v": 0,
             "group": {
                 "_id": "56e7da1671be6b38d3beb967",
                 "name": "test",
                 "sortName": "test",
                 "description": "test",
                 "created": 1458035222590,
                 "organizationId": "56ab7b9061b760d9eb6feba3",
                 "type": 1,
                 "__v": 0,
                 "users": ["56c32acd331dd81f8134f200", "56e6b6d206552124125cdb86"],
                 "usersCount": 2,
                 "userModels": [{
                     "_id": "56c32acd331dd81f8134f200",
                     "name": "Ken",
                     "sortName": "ken yasue",
                     "description": "ああああ",
                     "userid": "kenyasue",
                     "password": "*****",
                     "created": 1455631053660,
                     "status": 1,
                     "organizationId": "56ab7b9061b760d9eb6feba3",
                     "__v": 0,
                     "tokenGeneratedAt": 1458058317218,
                     "token": "*****",
                     "groups": ["56e7ef842500caf2eda5d5fb", "56e7da1671be6b38d3beb967", "56dee2fd1f9b351bcd4e5469"],
                     "avatar": {
                         "thumbnail": {
                             "originalName": "2015-01-11 21.30.05 HDR.jpg",
                             "size": 1551587,
                             "mimeType": "image/png",
                             "nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
                         },
                         "picture": {
                             "originalName": "2015-01-11 21.30.05 HDR.jpg",
                             "size": 1551587,
                             "mimeType": "image/png",
                             "nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
                         }
                     }
                 }, {
                     "_id": "56e6b6d206552124125cdb86",
                     "name": "user1",
                     "sortName": "user1",
                     "description": "user1",
                     "userid": "testuser1",
                     "password": "*****",
                     "created": 1457960658915,
                     "status": 1,
                     "organizationId": "56ab7b9061b760d9eb6feba3",
                     "__v": 0,
                     "tokenGeneratedAt": 1458058365344,
                     "token": "*****",
                     "groups": ["56e7da1671be6b38d3beb967", "56dee3091f9b351bcd4e546a"]
                 }]
             }
         }, {
             "_id": "56e83277fabab6dd2c0e1860",
             "userId": "56e6b6d206552124125cdb86",
             "chatId": "56c32acd331dd81f8134f200",
             "chatType": 1,
             "lastUpdate": 1458058176955,
             "isUnread": 1,
             "lastUpdateUser": {
                 "_id": "56c32acd331dd81f8134f200",
                 "name": "Ken",
                 "sortName": "ken yasue",
                 "description": "ああああ",
                 "userid": "kenyasue",
                 "password": "*****",
                 "created": 1455631053660,
                 "status": 1,
                 "organizationId": "56ab7b9061b760d9eb6feba3",
                 "__v": 0,
                 "tokenGeneratedAt": 1458058165516,
                 "token": "*****",
                 "groups": ["56e7ef842500caf2eda5d5fb", "56e7da1671be6b38d3beb967", "56dee2fd1f9b351bcd4e5469"],
                 "avatar": {
                     "thumbnail": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
                     },
                     "picture": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
                     }
                 }
             },
             "lastMessage": {
                 "type": 1,
                 "created": 1458058176946,
                 "message": "ss"
             },
             "unreadCount": 7,
             "__v": 0,
             "user": {
                 "_id": "56c32acd331dd81f8134f200",
                 "name": "Ken",
                 "sortName": "ken yasue",
                 "description": "ああああ",
                 "userid": "kenyasue",
                 "password": "*****",
                 "created": 1455631053660,
                 "status": 1,
                 "organizationId": "56ab7b9061b760d9eb6feba3",
                 "__v": 0,
                 "tokenGeneratedAt": 1458058317218,
                 "token": "*****",
                 "groups": ["56e7ef842500caf2eda5d5fb", "56e7da1671be6b38d3beb967", "56dee2fd1f9b351bcd4e5469"],
                 "avatar": {
                     "thumbnail": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
                     },
                     "picture": {
                         "originalName": "2015-01-11 21.30.05 HDR.jpg",
                         "size": 1551587,
                         "mimeType": "image/png",
                         "nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
                     }
                 },
                 "onlineStatus": 1
             }
         }],
         "count": 3,
         "totalUnreadCount": 20
     }
 }
 **/

router.get("/:page", auth({ allowUser: true }), async function (request, response) {
  try {
    const androidBuildNumber = request.headers.android_build_number;
    const iOSBuildNumber = request.headers.ios_build_number;
    const softwareVersion = request.user.softwareVersion ? request.user.softwareVersion : {};

    let updateFlg = false;

    if (
      androidBuildNumber &&
      (!softwareVersion.android || androidBuildNumber > softwareVersion.android)
    ) {
      softwareVersion.android = androidBuildNumber;
      updateFlg = true;
    }

    if (iOSBuildNumber && (!softwareVersion.ios || iOSBuildNumber > softwareVersion.ios)) {
      softwareVersion.ios = iOSBuildNumber;
      updateFlg = true;
    }

    if (updateFlg) {
      await User.findByIdAndUpdate(request.user._id.toString(), { softwareVersion });
    }

    let page = 0;

    if (request.params.page) {
      if (request.params.page == "0") {
        page = 0;
      } else {
        page = +request.params.page - 1;
      }
    }

    const res = await getList(0, page, request);

    return Base.successResponse(response, Const.responsecodeSucceed, res);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "HistoryListController page error",
      error,
    );
  }
});

/**
 * @api {get} /api/v2/user/history/diff/:lastUpdate historylist for update
 * @apiName History List for update
 * @apiGroup WebAPI
 * @apiDescription Returns user history which is updated from lastUpdate param
 * @apiHeader {String} access-token Users unique access-token.
 * @apiSuccessExample Success-Response:
 * same as history list
 **/

router.get("/diff/:lastUpdate", auth({ allowUser: true }), async function (request, response) {
  try {
    const res = await getList(request.params.lastUpdate, 0, request);

    return Base.successResponse(response, Const.responsecodeSucceed, res);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "HistoryListController diff lastUpdate error",
      error,
    );
  }
});

async function getList(lastUpdate, page, request, searchObj = null) {
  const user = request.user;
  const keyword = request.query.keyword;

  let res = null;
  if (lastUpdate > 0) {
    res = await History.find({
      chatType: { $ne: Const.chatTypeBroadcastAdmin },
      userId: user._id.toString(),
      ownerRemoved: null,
      $expr: { $gt: ["$lastUpdate", "$isDeleted"] },
      $or: [{ lastUpdate: { $gt: lastUpdate } }, { lastUpdateUnreadCount: { $gt: lastUpdate } }],
    })
      .sort({ lastUpdate: "desc" })
      .lean();
  } else {
    let queryObj = {
      chatType: { $ne: Const.chatTypeBroadcastAdmin },
      ownerRemoved: null,
      userId: user._id.toString(),
      $expr: { $gt: ["$lastUpdate", "$isDeleted"] },
    };

    if (keyword) {
      queryObj = {
        ...queryObj,
        keyword: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i"),
      };
    }

    if (page > -1) {
      res = await History.find(queryObj)
        .sort({ lastUpdate: "desc" })
        .skip(Const.pagingRows * page)
        .limit(Const.pagingRows)
        .lean();
    } else {
      res = await History.find(queryObj).sort({ lastUpdate: "desc" }).lean();
    }
  }

  res = res || [];

  const deviceType = request.headers["device-type"];
  const androidVersionCode = !request.headers["android-version-code"]
    ? 0
    : +request.headers["android-version-code"].toString();
  const iosVersionCode = !request.headers["ios-version-code"]
    ? 0
    : +request.headers["ios-version-code"].toString();

  if (
    (page === 0 || page === -1) &&
    (deviceType === "web" ||
      (iosVersionCode && iosVersionCode >= 618) ||
      (androidVersionCode && androidVersionCode >= 140026))
  ) {
    const adminBroadcastRoom = await Room.findOne({
      type: Const.chatTypeBroadcastAdmin,
    }).lean();

    const broadcastHistory = await History.findOne({
      userId: request.user._id.toString(),
      chatId: adminBroadcastRoom._id.toString(),
      chatType: Const.chatTypeBroadcastAdmin,
    }).lean();

    const owner = await User.findById(adminBroadcastRoom.owner, {
      userName: 1,
      phoneNumber: 1,
      created: 1,
      avatar: 1,
      bankAccounts: 1,
    }).lean();

    const newHistory = broadcastHistory
      ? broadcastHistory
      : (
          await History.create({
            userId: request.user._id.toString(),
            chatId: adminBroadcastRoom._id.toString(),
            chatType: Const.chatTypeBroadcastAdmin,
            lastUpdate: 0,
            lastUpdateUnreadCount: 0,
            unreadCount: 0,
            keyword: `Admin broadcasts for ${request.user.userName}`,
          })
        ).toObject();

    newHistory.broadcast = {
      _id: adminBroadcastRoom._id.toString(),
      name: adminBroadcastRoom.name,
      created: adminBroadcastRoom.created,
      avatar: adminBroadcastRoom.avatar,
      owner: owner,
    };

    const messagesSortedByDate = await FlomMessage.find({
      roomID: `5-${adminBroadcastRoom._id.toString()}`,
    })
      .sort({ created: -1 })
      .limit(1)
      .lean();

    if (messagesSortedByDate.length > 0) {
      const lastMessage = messagesSortedByDate[0];

      const {
        _id: messageIdRaw,
        sentTo,
        userID: userId,
        message,
        type,
        created: msgCreated,
      } = lastMessage;

      newHistory.lastMessage = {
        messageId: messageIdRaw.toString(),
        message,
        type,
        created: msgCreated,
        sentTo,
      };

      const lastSender = await User.findById(userId).lean();

      const {
        _id: userIdRaw,
        avatar,
        bankAccounts,
        userName: name,
        created: userCreated,
        phoneNumber,
        description,
      } = lastSender;

      newHistory.lastUpdateUser = {
        avatar,
        bankAccounts,
        name,
        created: userCreated,
        phoneNumber,
        description,
        _id: userIdRaw,
      };

      newHistory.lastUpdate = lastMessage.created;
    }

    res.unshift(newHistory);
  }

  let count = await History.countDocuments({
    userId: user._id.toString(),
    $expr: { $gt: ["$lastUpdate", "$isDeleted"] },
  });
  let loadNextPage = Const.pagingRows * (page + 1) < count;

  const userIds = res
    .filter((item) => item.chatType === Const.chatTypePrivate)
    .map((item) => item.chatId)
    .filter((userId) => Utils.isObjectId(userId));
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const usersMap = {};
  users.forEach((user) => {
    usersMap[user._id.toString()] = user;
  });

  res.forEach((item) => {
    if (item.chatType === Const.chatTypePrivate) {
      item.user = usersMap[item.chatId];
    }
  });
  res = res.filter((item) => {
    if (item.chatType != Const.chatTypePrivate) {
      return true;
    }

    return !!item.user;
  });

  const userIds2 = Array.from(
    new Set(
      res.map((item) => {
        if (item.user && item.user._id) {
          return item.user._id.toString();
        }
      }),
    ),
  );
  const userContacts = await UserContact.find({
    userId: user._id.toString(),
    contactId: { $in: userIds2 },
  }).lean();
  const userContactsMap = {};
  userContacts.forEach((contact) => {
    userContactsMap[contact.contactId] = contact;
  });

  res.forEach((item) => {
    if (item.user && item.user._id) {
      const contact = userContactsMap[item.user._id.toString()];
      if (contact && contact.name) {
        item.lastUpdateUser.name = contact.name;
        item.user.name = contact.name;
      }
    }
  });

  const groupIds = res
    .filter((item) => item.chatType === Const.chatTypeGroup)
    .map((item) => item.chatId)
    .filter((groupId) => Utils.isObjectId(groupId));
  const groups = await Group.find({ _id: { $in: groupIds } }).lean();
  const groupsMap = {};
  groups.forEach((group) => {
    groupsMap[group._id.toString()] = group;
  });

  res.forEach((item) => {
    if (item.chatType === Const.chatTypeGroup) {
      item.group = groupsMap[item.chatId];
    }
  });

  res = res.filter((item) => {
    if (item.chatType != Const.chatTypeGroup) {
      return true;
    }

    return !!item.group;
  });

  const roomIds = res
    .filter((item) => item.chatType === Const.chatTypeRoom)
    .map((item) => item.chatId)
    .filter((roomId) => Utils.isObjectId(roomId));
  const rooms = await Room.find({ _id: { $in: roomIds } }).lean();
  const roomsMap = {};
  rooms.forEach((room) => {
    roomsMap[room._id.toString()] = room;
  });

  res.forEach((item) => {
    if (item.chatType === Const.chatTypeRoom) {
      item.room = roomsMap[item.chatId];
    }
  });

  res = res.filter((item) => {
    if (item.chatType != Const.chatTypeRoom) {
      return true;
    }

    return !!item.room;
  });

  const userIdsFromGroup = [];

  // make sure at least 4 users from each history
  res.forEach((item) => {
    if (item.chatType == Const.chatTypeGroup && item.group && Array.isArray(item.group.users)) {
      userIdsFromGroup.push(...item.group.users.slice(0, 4));
    }
  });

  const userIdsFromRoom = [];

  // make sure at least 4 users from each history
  res.forEach((item) => {
    if (item.chatType == Const.chatTypeRoom && item.room) {
      if (Array.isArray(item.room.users)) {
        userIdsFromRoom.push(...item.room.users.slice(0, 4));
      }

      if (item.room.owner) {
        userIdsFromRoom.push(item.room.owner);
      }
    }
  });

  const userIds3 = Array.from(new Set(userIdsFromGroup.concat(userIdsFromRoom)));
  const users2 = await User.find(
    { _id: { $in: userIds3 } },
    User.getDefaultResponseFields(),
  ).lean();
  const users2Map = {};
  users2.forEach((user) => {
    users2Map[user._id.toString()] = user;
  });

  res.forEach((item) => {
    if (item.chatType == Const.chatTypeGroup && item.group && Array.isArray(item.group.users)) {
      const userModels = item.group.users
        .slice(0, 4)
        .map((userId) => users2Map[userId])
        .filter((user) => !!user);

      item.group.usersCount = item.group.users.length;
      item.group.userModels = userModels;
    }

    if (item.chatType == Const.chatTypeRoom && item.room) {
      if (Array.isArray(item.room.users)) {
        const userModels = item.room.users
          .slice(0, 4)
          .map((userId) => users2Map[userId])
          .filter((user) => !!user);

        item.room.usersCount = item.room.users.length;
        item.room.userModels = userModels;
      }

      // get owner
      item.room.ownerModel = users2Map[item.room.owner];
    }
  });

  const totalUnread = await totalUnreadCount(user._id.toString());

  const userIds4 = res
    .filter((userId) => !!userId && Utils.isObjectId(userId))
    .map((item) => item.user._id.toString());

  const onlineStatusResult = await getUsersOnlineStatus(userIds4);

  res.forEach((item) => {
    if (item.user && item.user._id) {
      const onlineStatusObj = onlineStatusResult.find(
        (onlineStatusRow) => onlineStatusRow.userId == item.user._id.toString(),
      );

      if (onlineStatusObj) {
        item.user.onlineStatus = onlineStatusObj.onlineStatus;
        item.user.lastSeen = onlineStatusObj.lastSeen;
      } else {
        item.user.onlineStatus = 0;
      }
    }
  });

  if (searchObj) {
    const { page: p, query } = searchObj;

    const searchResult = [];

    for (const item of res) {
      if (item.chatType === Const.chatTypePrivate) {
        if (item.user.userName.toLowerCase().includes(query.toLowerCase())) searchResult.push(item);
      } else if (item.chatType === Const.chatTypeGroup) {
        if (item.group.name.toLowerCase().includes(query.toLowerCase())) searchResult.push(item);
      } else if (item.chatType === Const.chatTypeRoom) {
        if (item.room.name.toLowerCase().includes(query.toLowerCase())) searchResult.push(item);
      } else if (item.chatType === Const.chatTypeBroadcastAdmin) {
        if (item.broadcast.name.toLowerCase().includes(query.toLowerCase()))
          searchResult.push(item);
      }
    }

    const paginatedResult = searchResult.slice(
      (p - 1) * Const.pagingRows,
      (p - 1) * Const.pagingRows + Const.pagingRows,
    );

    res = paginatedResult;
    count = searchResult.length;
    loadNextPage = searchResult.length > p * Const.pagingRows;
  }

  return { list: res, count, totalUnreadCount: totalUnread, loadNextPage };
}

module.exports = router;
