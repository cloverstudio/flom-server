"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Room, User } = require("#models");
const { getUsersOnlineStatus } = require("#logics");

/**
     * @api {get} /api/v2/room/users/:roomId/:page RoomUserList
     * @apiName RoomUserList
     * @apiGroup WebAPI
     * @apiDescription Returns users of the room. If send "all" text as page param, it returns all user.
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:


{ code: 1,
  time: 1457096396842,
  data: 
   { count: 4,
     list: 
      [ { _id: '56d986cbfc6914974deb7676',
          name: 'test',
          userid: 'userid17RH5J',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395204,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395644,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'max.jpg',
                size: 64914,
                mimeType: 'image/png',
                nameOnServer: 'dDCn5wYHP7d8RkkwvoaTZxdckv8IRqDX' },
             picture: 
              { originalName: 'max.jpg',
                size: 64914,
                mimeType: 'image/png',
                nameOnServer: 'RChBqbqMVD7ScoaTUcc2iSvVRTuoJybp' } } },
        { _id: '56d986cbfc6914974deb7677',
          name: 'User2',
          userid: 'userid22eVJu',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395215,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395639,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'user1.jpg',
                size: 36023,
                mimeType: 'image/png',
                nameOnServer: 'l4GFBU2lzNa42q7Rymx31q96u3XpgPbV' },
             picture: 
              { originalName: 'user1.jpg',
                size: 36023,
                mimeType: 'image/png',
                nameOnServer: 'ThremyfFhXrP6YlqxOAzva52Jpx7ulfx' } } },
        { _id: '56d986cbfc6914974deb7678',
          name: 'User3',
          userid: 'userid3RP0zE',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395221,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395640,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'user2.jpg',
                size: 53586,
                mimeType: 'image/png',
                nameOnServer: 'pILnZ13qS1PldslPmuGwPKC3FkwZrTP1' },
             picture: 
              { originalName: 'user2.jpg',
                size: 53586,
                mimeType: 'image/png',
                nameOnServer: 'Tqy2TWTJO9qblAixb578ZhiFOthENw7F' } } },
        { _id: '56d986cbfc6914974deb7679',
          name: 'User4',
          userid: 'userid4tIcLG',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395228,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395644,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'user3.png',
                size: 54101,
                mimeType: 'image/png',
                nameOnServer: 'Pit9pVfi3jVuWG2HbvlCoZzPOg8xQJwg' },
             picture: 
              { originalName: 'user3.png',
                size: 54101,
                mimeType: 'image/png',
                nameOnServer: 'Kvay7NvUPMvMiYkjPJvOogcVNLJZgejO' } } } ] } }
                

**/

router.get("/:roomId/:page", async function (request, response) {
  try {
    const roomId = request.params.roomId;

    let page = 0;
    let getAll = false;
    if (/^[0-9]+$/.test(request.params.page)) page = request.params.page - 1;
    else if (request.params.page == "all") getAll = true;

    const room = await Room.findById(roomId).lean();
    if (!room) {
      return Base.successResponse(response, Const.responsecodeRoomDetailInvalidRoomId);
    }

    let query = null;
    if (getAll) {
      query = User.find({
        _id: { $in: room.users },
      }).sort({ sortName: "asc" });
    } else {
      query = User.find({
        _id: { $in: room.users },
      })
        .sort({ sortName: "asc" })
        .skip(Const.pagingRows * page)
        .limit(Const.pagingRows);
    }

    const list = await query.lean();
    const userIds = list.map((item) => item._id.toString());

    const onlineStatusResult = await getUsersOnlineStatus(userIds);
    onlineStatusResult.forEach((row) => {
      if (!row.userId) return;

      const key = list.findIndex((userForKey) => userForKey._id.toString() === row.userId);
      if (key !== -1) list[key].onlineStatus = row.onlineStatus;
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      count: room.users.length,
      list,
    });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "RoomUserList", error);
  }
});

module.exports = router;
