"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room, Tribe } = require("#models");
const fsp = require("fs/promises");
const {
  formatImageData,
  formatNewTribe,
  checkUsers,
  createTribeGroupChat,
  notifyInvitedTribeUsers,
} = require("../helpers");

/**
 * @api {post} /api/v2/tribes Add new tribe
 * @apiVersion 2.0.10
 * @apiName Add new tribe
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for adding new tribe. RoomId is the id of the tribe group chat
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam {String} name Name of the tribe
 * @apiParam {String} description Tribe's description
 * @apiParam {String} [isHidden] Is tribe hidden. "true" for true, default is false
 * @apiParam {String} [members] User id's to invite to tribe
 * @apiParam {String} [membersWithRoles] JSON stringified array of user ids and roles to invite to tribe (e.g. "[{"id":"as1sa","role":1}]"). Roles:
 *                                       1 - member, 2 - elder, 3 - co-owner
 * @apiParam {File} [image] Tribe's image. File has to be image (jpeg, jpg, png...)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1643163567261,
 *   "data": {
 *     "tribe": {
 *       "members": {
 *         "accepted": [],
 *         "declined": [],
 *         "requested": [],
 *         "invited": [ { id: "5f7ef72ca283bc433d9d7240", role: 1 } ]
 *       },
 *       "image": {},
 *       "created": 1643163567202,
 *       "_id": "61f0afaf827b071698ce3dbd",
 *       "name": "Tribe name",
 *       "description": "This is my tribe!",
 *       "ownerId": "5f87132ffa90652b60469b96",
 *       "numberOfMembers": 0,
 *       "roomId": "5f87132ffa90652b60469b96"
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
 * @apiError (Errors) 400007 Token not valid
 * @apiError (Errors) 443470 Bad name parameter
 * @apiError (Errors) 443471 Bad description parameter
 * @apiError (Errors) 443472 Bad image file
 * @apiError (Errors) 443484 membersWithRoles JSON parsing error
 * @apiError (Errors) 443485 Invalid membersWithRoles parameter (e.g. sending owner id, invalid id, invalid role)
 */

router.post("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const requestUserId = request.user._id.toString();
    const data = await Utils.formParse(request);
    const { name, description, members, membersWithRoles } = data?.fields || {};
    const isHidden = data?.fields?.isHidden === "true" ? true : false;
    const image = data?.files?.image;

    if (typeof name !== "string" || name.trim().length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeInvalidName,
        message: `CreateTribeController, bad name parameter`,
      });
    }

    if (typeof description !== "string" || description.trim().length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeInvalidDescription,
        message: `CreateTribeController, bad description parameter`,
      });
    }

    const { formattedUsers, usersToNotify, code, message } =
      (await checkUsers({
        members,
        membersWithRoles,
        requestUserId,
      })) || {};
    if (code) {
      return Base.newErrorResponse({
        response,
        code,
        message: `CreateTribeController, ${message}`,
      });
    }

    if (image && image.type.split("/")[0] !== "image") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeImageInvalid,
        message: `CreateTribeController, bad image parameter`,
      });
    }

    const formattedImage = image ? formatImageData(image) : {};

    if (image) {
      await fsp.copyFile(image.path, `${Config.uploadPath}/${formattedImage.nameOnServer}`);
      formattedImage.thumbnailName = await Utils.generateThumbnailFromImage(
        formattedImage.nameOnServer,
      );
    }

    const groupChat = await createTribeGroupChat({
      owner: request.user,
      tribeName: name,
      tribeDescription: description,
      image: formattedImage,
    });

    const tribe = await Tribe.create({
      name,
      description,
      ownerId: requestUserId,
      image: formattedImage,
      members: {
        accepted: [],
        declined: [],
        requested: [],
        invited: formattedUsers,
      },
      roomId: groupChat._id.toString(),
      isHidden,
    });

    await Room.updateOne({ _id: tribe.roomId }, { $set: { tribeId: tribe._id.toString() } });

    if (usersToNotify.length > 0) {
      await notifyInvitedTribeUsers({ tribe, receivers: usersToNotify, sender: request.user });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { tribe: formatNewTribe(tribe) });
  } catch (error) {
    Base.newErrorResponse({ response, message: "CreateTribeController", error });
  }
});

module.exports = router;
