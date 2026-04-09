"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Room, Organization } = require("#models");
const { socketApi } = require("#sockets");
const { updateHistory } = require("#logics");
const fsp = require("fs/promises");
const easyimg = require("easyimage");

/**
      * @api {post} /api/v2/room/new New Room
      * @apiName Create New room
      * @apiGroup WebAPI
      * @apiHeader {String} access-token Users unique access-token.
      * @apiDescription Create new conversation
      * @apiParam {name} name of room.
      * @apiParam {string} description Description
      * @apiParam {file} file file
      * @apiParam {string} users comma separated user ids.
      * @apiParamExample {json} Request-Example:
         {
             name : "name of conversation ", // if empty generates by users
             useOld: false, // put true if use old conversation for same users
             users: [
                 "563a0cc46cb168c8e9c4071d",
                 "563a0cc46cb168c8e9c4071a",
                 "563a0cc46cb168c8e9c4071b"
             ]
         }
      * @apiSuccessExample Success-Response:
 {
     code: 1,
     time: 1455785008104,
     data: {
         room: {
             __v: 0,
             owner: '56c5842faea1bfac4a657bbd',
             name: 'room1',
             created: 1455785008046,
             _id: '56c58430aea1bfac4a657bc1',
             avatar: {
                 thumbnail: {
                     originalName: 'dfhSvtAQyCGMALxs4AZXzuZVOrXSmbfg',
                     size: 136825,
                     mimeType: 'image/png',
                     nameOnServer: 'dfhSvtAQyCGMALxs4AZXzuZVOrXSmbfg'
                 },
                 picture: {
                     originalName: 'dfhSvtAQyCGMALxs4AZXzuZVOrXSmbfg',
                     size: 136825,
                     mimeType: 'image/png',
                     nameOnServer: 'dfhSvtAQyCGMALxs4AZXzuZVOrXSmbfg'
                 }
             },
             users: ['56c5842faea1bfac4a657bbd',
                 '56c5842faea1bfac4a657bbe',
                 '56c5842faea1bfac4a657bbf',
                 '56c5842faea1bfac4a657bc0'
             ]
         }
     }
 }
     */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { fields = {}, files = {} } = await Utils.formParse(request);
    const file = files.file || null;

    const organization = await Organization.findById(request.user.organizationId).lean();
    if (!organization) {
      return Base.successResponse(response, Const.httpCodeServerError);
    }

    const maxRoomNumber = organization.maxRoomNumber;
    const numberOfRooms = await Room.countDocuments({
      organizationId: request.user.organizationId,
    });
    if (numberOfRooms >= maxRoomNumber) {
      return Base.successResponse(response, Const.responsecodeMaxRoomNumber);
    }

    let useOld = false;
    if (fields.useOld == 1) {
      useOld = true;
    }
    const userIds = fields.users
      ? fields.users.split(",").filter((userId) => Utils.isObjectId(userId))
      : [];

    if (userIds.length === 0) {
      return Base.successResponse(response, Const.httpCodeServerError);
    }

    const resultRoom = await logic(
      request.user._id,
      request.user.organizationId,
      userIds,
      useOld,
      fields.name,
      fields.description,
      file,
    );

    if (!resultRoom) {
      return Base.errorResponse(
        response,
        Const.httpCodeServerError,
        "CreateRoomController",
        "Failed to create room",
      );
    }

    const roomId = resultRoom._id.toString();

    updateHistory.newRoom(resultRoom);

    // send socket
    resultRoom.users.forEach((userId) => {
      if (userId) {
        socketApi.emitToUser(userId, "new_room", { conversation: resultRoom });
      }
    });

    const usersArray = fields.users
      ? fields.users.split(",").filter((userId) => Utils.isObjectId(userId))
      : [];
    usersArray.push(request.user._id.toString());
    usersArray.forEach((userId) => {
      socketApi.joinTo(userId, Const.chatTypeRoom, roomId);
    });

    return Base.successResponse(response, Const.responsecodeSucceed, { room: resultRoom });
  } catch (error) {
    console.error("Error in CreateRoomController:", error);
    return Base.errorResponse(response, Const.httpCodeServerError, "CreateRoomController", error);
  }
});

async function logic(
  ownerUserId,
  ownerOrganizationId,
  users,
  useOld,
  defaultName,
  description,
  picture,
) {
  // save to database
  const newRoom = new Room({
    owner: ownerUserId,
    admins: [ownerUserId],
    organizationId: ownerOrganizationId,
    users: [],
    name: "",
    created: Date.now(),
    avatar: {
      picture: {},
      thumbnail: {},
    },
  });

  if (ownerUserId && Utils.isObjectId(ownerUserId)) {
    ownerUserId = ownerUserId.toString();
  }

  newRoom.users = Array.from(new Set(users.concat(ownerUserId)));

  if (!defaultName) {
    const newName = await generateConversationName(ownerUserId.toString(), newRoom.users);
    newRoom.name = newName;
  } else {
    newRoom.name = defaultName;
  }

  if (picture && picture.size >= 10) {
    const avatarData = await setAvatar(picture);
    if (avatarData) {
      newRoom.avatar.thumbnail = avatarData.thumbnail;
      newRoom.avatar.picture = avatarData.picture;
    }
  }

  if (description) {
    newRoom.description = description;
  }

  const savedRoom = await newRoom.save();
  return savedRoom.toObject();
}

async function generateConversationName(ownerId) {
  const owner = await User.findById(ownerId).lean();

  if (owner) {
    return Utils.shorten(owner.name + "'s New Group");
  } else {
    return "New Group";
  }
}

async function setAvatar(file) {
  try {
    let tempPath = file.path;
    let fileName = file.name;
    let destPath = Config.uploadPath + "/";
    let newFileName = Utils.getRandomString(32);

    await fsp.copyFile(tempPath, destPath + newFileName);

    await easyimg.rescrop({
      src: destPath + newFileName,
      dst: destPath + newFileName,
      width: 512,
      height: 512,
      cropwidth: 512,
      cropheight: 512,
      x: 0,
      y: 0,
    });

    await easyimg.convert({
      src: destPath + newFileName,
      dst: destPath + newFileName + ".png",
      quality: 100,
    });

    await fsp.rename(destPath + newFileName + ".png", destPath + newFileName);

    // generate thumbnail
    let thumbFileName = Utils.getRandomString(32);
    const destPathTmp = Config.uploadPath + "/" + thumbFileName;

    await easyimg.thumbnail({
      src: Config.uploadPath + "/" + newFileName,
      dst: destPathTmp + ".png",
      width: Const.thumbSize,
      height: Const.thumbSize,
    });

    await fsp.rename(destPathTmp + ".png", destPathTmp);

    const stats = await fsp.stat(Config.uploadPath + "/" + thumbFileName);

    if (thumbFileName && newFileName) {
      return {
        picture: {
          originalName: file.name,
          size: file.size,
          mimeType: "image/png",
          nameOnServer: newFileName,
        },
        thumbnail: {
          originalName: file.name,
          size: stats.size,
          mimeType: "image/png",
          nameOnServer: thumbFileName,
        },
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in setAvatar:", error);
    return null;
  }
}

module.exports = router;
