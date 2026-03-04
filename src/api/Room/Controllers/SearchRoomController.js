"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { History } = require("#models");
const { searchRoom } = require("#logics");

/**
      * @api {get} /api/v2/room/search/:page?keyword=keyword Search Room
      * @apiName Search Room
      * @apiGroup WebAPI
      * @apiDescription Returns rooms matches to the keyword
      * @apiHeader {String} access-token Users unique access-token.
      * @apiSuccessExample Success-Response:
     {
         "code": 1,
         "time": 1458048275869,
         "data": {
             "list": [
                 {
                     "_id": "56e19ec20dc358a4c4c1bab3",
                     "owner": "56c32acd331dd81f8134f200",
                     "name": "Ken",
                     "created": 1457626818892,
                     "__v": 0,
                     "description": "test",
                     "modified": 1457962642422,
                     "avatar": {
                         "thumbnail": {
                             "originalName": "wAO6OLzQqrdRaT9xP15pFmcCJGcKSuo1",
                             "size": 112325,
                             "mimeType": "image/png",
                             "nameOnServer": "wAO6OLzQqrdRaT9xP15pFmcCJGcKSuo1"
                         },
                         "picture": {
                             "originalName": "wAO6OLzQqrdRaT9xP15pFmcCJGcKSuo1",
                             "size": 112325,
                             "mimeType": "image/png",
                             "nameOnServer": "wAO6OLzQqrdRaT9xP15pFmcCJGcKSuo1"
                         }
                     },
                     "users": ["56c32acd331dd81f8134f200"],
                     "type": 3
                 }
             ],
             "count": 1
         }
     }
 
 **/

router.get("/:page", auth({ allowUser: true }), async (request, response) => {
  try {
    const keyword = request.query.keyword;
    const page = +request.params.page - 1;
    const userId = request.user._id.toString();

    const history = await History.find({ userId, chatType: Const.chatTypeRoom }).lean();
    const { list, count } = await searchRoom(userId, keyword, page);
    const rooms = list
      .map((item) => {
        item.type = Const.chatTypeRoom;
        const lastUpdate = history.find((h) => h.chatId === item._id.toString())?.lastUpdate || 0;
        return { ...item, lastUpdate };
      })
      .sort((a, b) => b.lastUpdate - a.lastUpdate);

    return Base.successResponse(response, Const.responsecodeSucceed, { list: rooms, count });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "SearchRoomController", error);
  }
});

module.exports = router;
