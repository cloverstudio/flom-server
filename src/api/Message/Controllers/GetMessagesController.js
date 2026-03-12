"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { FlomMessage, User } = require("#models");

/**
 * @api {get} /api/v2/messages Get messages flom_v1
 * @apiVersion 2.0.24
 * @apiName Get messages flom_v1
 * @apiGroup WebAPI Message
 * @apiDescription Fetches messages sent to request user. If a message that is requested is not sent to user it is ignored.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} messageId  Message ids to fetch, query should look like this: '?messageId=abcdef1234567&messageId=abcdef1234568'
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1727096609433,
 *     "data": {
 *         "messages": [
 *             {
 *                 "_id": "66e16fd140cfc6694f216a7c",
 *                 "seenBy": [
 *                     {
 *                         "user": "641d9c333478cf0d6a500547",
 *                         "at": 1726051332998,
 *                         "version": 2
 *                     }
 *                 ],
 *                 "deliveredTo": [],
 *                 "sentTo": [
 *                     "641d9c333478cf0d6a500547"
 *                 ],
 *                 "isAdminMessage": false,
 *                 "remoteIpAddress": "86.33.87.13",
 *                 "userID": "63dccc42bcc5921af87df5ce",
 *                 "roomID": "1-63dccc42bcc5921af87df5ce-641d9c333478cf0d6a500547",
 *                 "message": "Imao sam te već u historyju.",
 *                 "localID": "w_UmPP6h5esCL02yvvIXHs8qZweFsAsx_1726050259041",
 *                 "type": 1,
 *                 "created": 1726050257992,
 *                 "receiverPhoneNumber": "+385958710207",
 *                 "receiverName": "Pero_B",
 *                 "senderPhoneNumber": "+2347087677188",
 *                 "senderName": "Major_Kira_Nerys",
 *                 "user": {
 *                     "_id": "63dccc42bcc5921af87df5ce",
 *                     "name": "Major_Kira_Nerys",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 311015,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "J86zLA5X85M2BKzuKyEUKeNnSm1SaO7H"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 100000,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "72QsCaJDcsJgXfEv8Svpe7g43cl1AMAP"
 *                         }
 *                     },
 *                     "description": "Plan 9 from Outer Space is a 1959 American science fiction film."
 *                 },
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "66e17c3040cfc6694f216a81",
 *                 "seenBy": [
 *                     {
 *                         "user": "641d9c333478cf0d6a500547",
 *                         "at": 1726218108770,
 *                         "version": 2
 *                     }
 *                 ],
 *                 "deliveredTo": [
 *                     {
 *                         "userId": "641d9c333478cf0d6a500547",
 *                         "at": 1726053424223
 *                     }
 *                 ],
 *                 "sentTo": [
 *                     "641d9c333478cf0d6a500547"
 *                 ],
 *                 "isAdminMessage": false,
 *                 "remoteIpAddress": "86.33.87.13",
 *                 "userID": "63dccc42bcc5921af87df5ce",
 *                 "roomID": "1-63dccc42bcc5921af87df5ce-641d9c333478cf0d6a500547",
 *                 "message": "Dobar ti je avatar.",
 *                 "localID": "y7pqsBOmPcpn94LFVUOyvSl5vVXM4cmI_1726053425166",
 *                 "type": 1,
 *                 "created": 1726053424074,
 *                 "receiverPhoneNumber": "+385958710207",
 *                 "receiverName": "Pero_B",
 *                 "senderPhoneNumber": "+2347087677188",
 *                 "senderName": "Major_Kira_Nerys",
 *                 "user": {
 *                     "_id": "63dccc42bcc5921af87df5ce",
 *                     "name": "Major_Kira_Nerys",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 311015,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "J86zLA5X85M2BKzuKyEUKeNnSm1SaO7H"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 100000,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "72QsCaJDcsJgXfEv8Svpe7g43cl1AMAP"
 *                         }
 *                     },
 *                     "description": "Plan 9 from Outer Space is a 1959 American science fiction film."
 *                 },
 *                 "__v": 0
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443920 No message ids
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();

    let { messageId } = request.query;
    const messageIds = typeof messageId === "string" ? [messageId] : messageId;

    if (!messageIds || messageIds.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoMessageIds,
        message: "GetMessagesController, no message ids",
      });
    }

    const messages = await FlomMessage.find({ _id: { $in: messageIds } }).lean();

    const filteredMessages = [];

    for (const message of messages) {
      if (!message.sentTo.includes(userId) && message.userID !== userId) {
        continue;
      }

      message._id = message._id.toString();
      message.user = await User.findOne(
        { _id: message.userID },
        { description: 1, name: 1, username: 1, organizationId: 1, avatar: 1 },
      ).lean();
      if (message.user) {
        message.user._id = message.user._id.toString();
      }

      filteredMessages.push(message);
    }

    const responseData = { messages: filteredMessages };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetMessagesController",
      error,
    });
  }
});

module.exports = router;
