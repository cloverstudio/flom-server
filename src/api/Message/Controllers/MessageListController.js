"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { messageList } = require("#logics");

/**
	  * @api {get} /api/v2/message/list/:roomId/:lastMessageId/:direction
	  * @apiName MessageList
	  * @apiGroup WebAPI
	  * @apiDescription Returns list of messages. Direction should be string 'old' or 'new' or 'newAnd'
	  * @apiHeader {String} access-token Users unique access-token.
	  * @apiSuccessExample Success-Response:
 {
	 "code": 1,
	 "time": 1499868072495,
	 "data": {
		 "messages": [{
			 "__v": 0,
			 "_id": "594abd2a17a3077a5c0381dc",
			 "created": 1498070314307,
			 "localID": "culkpvtyEs1G6OUqQ2RkkjZXKBjZCFC7",
			 "message": "0301dc83cfffa5a368ade6872e397f7595c7cee27261a8cd0282c16caf0a41b3e86555ce92acf0c7ef00796fb6ff0540cf4df36a7e270cc840e84fbc3f293276bc243894f6e31a0ad81af10d9339fd1615aada49b4476f99c967a472437ffaa31636dafa8643eee8853b8ed7305111756625",
			 "remoteIpAddress": "109.60.110.82",
			 "roomID": "3-58fdd63c5b9736991af8ca13",
			 "type": 1,
			 "user": {
				 "_id": "56e0088062a63ebf55eef39a",
				 "description": "Samo jakooooo!!!",
				 "name": "Jurica Blazevic",
				 "organizationId": "56e005b1695213295419f5df",
				 "userid": "jurica.blazevic",
				 "avatar": {
					 "thumbnail": {
						 "originalName": "417020_10150655766113706_100243839_n.jpg",
						 "size": 28617,
						 "mimeType": "image/png",
						 "nameOnServer": "Nk51aWGNBmpP5im8x3ecJwAKizI7ANJe"
					 },
					 "picture": {
						 "originalName": "417020_10150655766113706_100243839_n.jpg",
						 "size": 28617,
						 "mimeType": "image/png",
						 "nameOnServer": "1QKB80SOm3waYooa3enPxPBIbiENj5Y6"
					 }
				 }
			 },
			 "userID": "56e0088062a63ebf55eef39a",
			 "seenBy": [{
				 "version": 2,
				 "at": 1498623027378,
				 "user": "57f315081d9cabd56e905080"
			 }..
			 ],
			 "isFavorite": 0
		 }, ...
		 }]
	 }
 }
 
 **/

router.get(
  "/:roomId/:lastMessageId/:direction",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const userID = request.user._id.toString();
      const roomId = request.params.roomId;
      const lastMessageId = request.params.lastMessageId;
      const direction = request.params.direction
        ? request.params.direction
        : Const.MessageLoadDirection.append;

      if (!roomId || roomId.includes("null")) {
        return Base.successResponse(response, Const.responsecodeMessageListInvalidParam);
      }

      const messages = await messageList({
        userID,
        roomId,
        lastMessageId,
        direction,
        encrypt: true,
      });

      return Base.successResponse(response, Const.responsecodeSucceed, { messages });
    } catch (error) {
      return Base.errorResponse(
        response,
        Const.httpCodeServerError,
        "MessageListController",
        error,
      );
    }
  },
);

module.exports = router;
