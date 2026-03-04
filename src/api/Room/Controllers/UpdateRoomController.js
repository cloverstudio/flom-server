"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room } = require("#models");
const fsp = require("fs/promises");
const formidable = require("formidable");
const easyimg = require("easyimage");

/**
      * @api {post} /api/v2/room/update Update Room Profile
      * @apiName Update Room Profile
      * @apiGroup WebAPI
      * @apiDescription Update profile of conversation
      * @apiHeader {String} access-token Users unique access-token.
      * @apiParam {string} roomId roomId
      * @apiParam {string} name Name to display
      * @apiParam {string} description Description
      * @apiParam {file} file avatar file
 
      * @apiSuccessExample Success-Response:
 {
     "code": 1,
     "time": 1457082886197,
     "data": {
         "room": {
             "_id": "56d94c88bf06a1f30ad6091d",
             "owner" : "56c32acd331dd81f8134f200"
             "ownerModel": {
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
                 "tokenGeneratedAt": 1457082869691,
                 "token": "*****",
                 "departments": [],
                 "groups": ["56cf0a60ed51d2905e28a848"],
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
             "name": "ああああああ",
             "created": 1457081480907,
             "__v": 0,
             "description": "いいいいいddd",
             "modified": 1457082886193,
             "avatar": {
                 "thumbnail": {
                     "originalName": "2014-06-03 17.23.39.jpg",
                     "size": 1504586,
                     "mimeType": "image/png",
                     "nameOnServer": "ut4G1A3Jq9LbfeDxXUh8jibgDB4wPGV1"
                 },
                 "picture": {
                     "originalName": "2014-06-03 17.23.39.jpg",
                     "size": 1504586,
                     "mimeType": "image/png",
                     "nameOnServer": "egStPNb3ysJKhUGtyeFzcwKCPgmp5Cnj"
                 }
             },
             "users": ["56c32acd331dd81f8134f200"]
         }
     }
 }
     */
router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const form = new formidable.IncomingForm();
    const { fields, files } = await form.parse(request);
    const roomId = fields.roomId;
    const userId = request.user._id.toString();

    const room = await Room.findById(roomId).lean();
    if (!room) {
      return Base.successResponse(response, Const.responsecodeUpdateRoomWrongRoomId);
    }

    if (room.owner.toString() !== userId) {
      return Base.successResponse(response, Const.responsecodeUpdateRoomNotAllowed);
    }

    const validateResult = await validate(fields, files.file);
    if (validateResult) {
      return Base.successResponse(response, validateResult);
    }

    const updateData = {
      name: fields.name,
      description: fields.description,
      modified: Date.now(),
    };

    if (files.file && files.file.size !== 0) {
      const tempPath = files.file.path;
      const fileName = files.file.name;
      const destPath = Config.uploadPath;

      const newFileName = Utils.getRandomString(32);
      const thumbFileName = Utils.getRandomString(32);

      await fsp.copyFile(tempPath, `${destPath}/${newFileName}`);
      await easyimg.convert({
        src: `${destPath}/${newFileName}`,
        dst: `${destPath}/${newFileName}.png`,
        quality: 100,
      });
      await fsp.rename(`${destPath}/${newFileName}.png`, `${destPath}/${newFileName}`);

      await easyimg.thumbnail({
        src: `${destPath}/${newFileName}`,
        dst: `${destPath}/${thumbFileName}.png`,
        width: Const.thumbSize,
        height: Const.thumbSize,
      });
      await fsp.rename(`${destPath}/${thumbFileName}.png`, `${destPath}/${thumbFileName}`);

      updateData.avatar = {
        picture: {
          originalName: fileName,
          size: files.file.size,
          mimeType: "image/png",
          nameOnServer: newFileName,
        },
        thumbnail: {
          originalName: fileName,
          size: files.file.size,
          mimeType: "image/png",
          nameOnServer: thumbFileName,
        },
      };
    }

    const updatedRoom = await Room.findByIdAndUpdate(roomId, updateData, { new: true, lean: true });
    updatedRoom.ownerModel = request.user.toObject();

    return Base.successResponse(response, Const.responsecodeSucceed, { room: updatedRoom });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "UpdateRoomController", error);
  }
});

async function validate(fields, file) {
  if (!fields.name) {
    return Const.responsecodeUpdateRoomWrongRoomName;
  }

  if (file && file.size !== 0) {
    if (
      file.type.indexOf("jpeg") == -1 &&
      file.type.indexOf("gif") == -1 &&
      file.type.indexOf("png") == -1
    ) {
      return Const.responsecodeUpdateRoomWrongFile;
    }
  }

  return null;
}

module.exports = router;
