"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Room, Group, Note, History } = require("#models");

/**
      * @api {get} /api/v2/note/list Get Note List
      * @apiName Get Note List
      * @apiGroup WebAPI
      * @apiDescription Get Note List
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1457363319718,
            "data": {
                "notes": [
                    {
                        "__v": 0,
                        "chatId": "1-56c32acd331dd81f8134f200-56c32acd331dd81f8134f200",
                        "note": "text",
                        "created": 1457363319710,
                        "modified": "1457363319710"
                    }
                ]
            }
        }
    
    **/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;

    const notes = await getNotes(user._id.toString());

    Base.successResponse(response, Const.responsecodeSucceed, { notes });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "NoteListController", error);
  }
});

async function getNotes(userId) {
  const { userIds, userMap } = await getUsers(userId);
  const { groupIds, groupMap } = await getGroups(userId);
  const { roomIds, roomMap } = await getRooms(userId);
  const broadcastChatId = await getBroadcastChat();

  const notes = await Note.find({
    $or: [
      ...userIds.map((id) => {
        return { chatId: new RegExp(`^1-.*${id}`) };
      }),
      { chatId: { $in: groupIds.map((id) => `2-${id}`) } },
      { chatId: { $in: roomIds.map((id) => `3-${id}`) } },
      { chatId: new RegExp(broadcastChatId) },
    ],
  }).lean();
  notes.sort((a, b) => {
    if (!a.modified) a.modified = a.created;
    if (!b.modified) b.modified = b.created;
    return b.modified - a.modified;
  });

  return notes.map((n) => {
    let chatName = "";
    let chatAvatar = null;
    if (n.chatId.startsWith("1-")) {
      const id1 = n.chatId.split("-")[1];
      const id2 = n.chatId.split("-")[2];
      const id = id1 === userId ? id2 : id1;
      const user = userMap.get(id);

      if (user) {
        chatName = user.name;
        chatAvatar = user.avatar;
      }
    } else if (n.chatId.startsWith("2-")) {
      const id = n.chatId.split("-")[1];
      const group = groupMap.get(id);
      if (group) {
        chatName = group.name;
        chatAvatar = group.avatar;
      }
    } else if (n.chatId.startsWith("3-")) {
      const id = n.chatId.split("-")[1];
      const room = roomMap.get(id);
      if (room) {
        chatName = room.name;
        chatAvatar = room.avatar;
      }
    } else if (n.chatId.startsWith("broadcast-")) {
      chatName = "Broadcast";
    }

    return { ...n, chatName, chatAvatar };
  });
}

async function getUsers(userId) {
  const userMap = new Map();

  const histories = await History.find({ userId }).lean();
  const userIds = Array.from(new Set(histories.map((h) => h.chatId).filter((id) => id)));
  const users = await User.find({ _id: { $in: userIds } }).lean();
  users.forEach((u) => {
    userMap.set(u._id.toString(), { name: u.userName, avatar: u.avatar });
  });

  return { userIds, userMap };
}

async function getGroups(userId) {
  const groupMap = new Map();

  const groups = await Group.find({ users: userId }).lean();
  const groupIds = groups.map((g) => g._id.toString());
  groups.forEach((g) => {
    groupMap.set(g._id.toString(), { name: g.name, avatar: g.avatar });
  });

  return { groupIds, groupMap };
}

async function getRooms(userId) {
  const roomMap = new Map();

  const rooms = await Room.find({
    $or: [{ users: userId }, { admins: userId }, { owner: userId, ownerRemoved: { $ne: true } }],
  }).lean();
  const roomIds = rooms.map((r) => r._id.toString());
  rooms.forEach((r) => {
    roomMap.set(r._id.toString(), { name: r.name, avatar: r.avatar });
  });

  return { roomIds, roomMap };
}

async function getBroadcastChat() {
  const adminBroadcastRoom = await Room.findOne({
    type: Const.chatTypeBroadcastAdmin,
  }).lean();

  return adminBroadcastRoom._id.toString();
}

module.exports = router;

/*

{
    "code": 1,
    "time": 1770393846907,
    "data": {
        "notes": [
            {
                "_id": "6986107e9435a8ac27d934eb",
                "chatId": "1-63e0d656a62453346de15e37-641d9c333478cf0d6a500547",
                "note": "test",
                "created": 1770393726009,
                "__v": 0,
                "modified": 1770393726009,
                "chatName": "Mer01",
                "chatAvatar": {
                    "picture": {
                        "originalName": "imageA_1675941548.jpg",
                        "size": 2459644,
                        "mimeType": "image/png",
                        "nameOnServer": "gSAor1NEcOI80CxOyiWIUDdtWBDufdmS"
                    },
                    "thumbnail": {
                        "originalName": "imageA_1675941548.jpg",
                        "size": 102000,
                        "mimeType": "image/png",
                        "nameOnServer": "giQmiVnX13ZmjjmHTHxCRlOItmZIWiOL"
                    }
                }
            }
        ]
    }
}

*/
