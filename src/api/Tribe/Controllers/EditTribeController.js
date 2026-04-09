"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room, Tribe, History, User } = require("#models");
const { socketApi } = require("#sockets");
const fsp = require("fs/promises");
const {
  formatImageData,
  formatNewTribe,
  checkUsers,
  handleTribeImage,
  notifyInvitedTribeUsers,
  removeUsersFromInvitedNotification,
  removeTribeRequestNotification,
  notifyRemovedUsers,
} = require("../helpers");

/**
 * @api {patch} /api/v2/tribes/{tribeId} Edit tribe
 * @apiVersion 2.0.10
 * @apiName Edit tribe
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for editing tribes
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam {String} [name] Name of the tribe
 * @apiParam {String} [description] Tribe's description
 * @apiParam {String} [addMembers] User id's to invite to tribe
 * @apiParam {String} [addMembersWithRoles] JSON stringified array of user ids and roles to invite to tribe (e.g. "[{"id":"as1sa","role":1}]")
 * @apiParam {String} [updatedMembersRoles] JSON stringified array of user ids and roles to update (e.g. "[{"id":"as1sa","role":1}]")
 * @apiParam {String} [removeMembers] User id's to remove from tribe
 * @apiParam {String} [deleteImage] String "1" for deleting image
 * @apiParam {String} [isHidden] String "true" or "false" to set tribe as hidden or not hidden
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
 *       "numberOfMembers": 0
 *       "roomId": "5f87132ffa90652b60469b96",
 *       "isHidden": false
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
 * @apiError (Errors) 443244 User not a member of the tribe
 * @apiError (Errors) 443470 Bad name parameter
 * @apiError (Errors) 443471 Bad description parameter
 * @apiError (Errors) 443472 Bad image file
 * @apiError (Errors) 443475 User not allowed to edit the tribe
 * @apiError (Errors) 443486 Maximum co-owners count reached
 */

router.patch("/:tribeId", auth({ allowUser: true }), async (request, response) => {
  try {
    const requestUser = request.user;
    const requestUserId = requestUser._id.toString();
    const tribeId = request.params.tribeId;

    if (!Utils.isValidObjectId(tribeId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeBadId,
        message: `EditTribeController, bad tribe id`,
      });
    }

    const tribe = await Tribe.findById(tribeId);
    if (!tribe) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeNotFound,
        message: `EditTribeController, no tribe found`,
      });
    }

    let requestUserRole;
    if (requestUserId === tribe.ownerId) {
      requestUserRole = Const.tribeMemberRoleOwner;
    } else {
      const tribeMember = tribe.members.accepted.find((member) => member.id === requestUserId);
      if (!tribeMember) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotMember,
          message: `EditTribeController, user not a member`,
        });
      }
      requestUserRole = tribeMember.role;
    }

    if (
      [Const.tribeMemberRoleCoOwner, Const.tribeMemberRoleOwner].indexOf(requestUserRole) === -1
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTribeEditNotAllowed,
        message: `EditTribeController, edit not allowed`,
      });
    }

    const owner = await User.findOne({ _id: tribe.ownerId }).lean();

    const data = await Utils.formParse(request);
    const {
      name,
      description,
      addMembers,
      addMembersWithRoles,
      updatedMembersRoles,
      removeMembers,
      deleteImage,
    } = data.fields;
    const image = data?.files?.image;

    if (data?.fields?.isHidden === "true") tribe.isHidden = true;
    if (data?.fields?.isHidden === "false") tribe.isHidden = false;

    //get tribe group chat (room)
    const roomId = tribe.roomId;
    let room = await Room.findOne({ _id: roomId });
    let roomUpdated = false;

    // in case tribe has no roomId create empty object, which will be filled with data and then ignored, instead of breaking the app
    if (!roomId) room = {};

    if (name && typeof name === "string") {
      tribe.name = name;
      room.name = name;
      roomUpdated = true;
    }
    if (description && typeof description === "string") {
      tribe.description = description;
      room.description = description;
      roomUpdated = true;
    }
    if ((addMembers && typeof addMembers === "string") || addMembersWithRoles) {
      let { formattedUsers, usersToNotify, code, message } =
        (await checkUsers({
          members: addMembers,
          membersWithRoles: addMembersWithRoles,
          ownerId: tribe.ownerId,
          requestUserId,
        })) || {};
      if (code) {
        return Base.newErrorResponse({
          response,
          code,
          message: `EditTribeController - invited users, ${message}`,
        });
      }

      if (formattedUsers.length > 0) {
        const currentAcceptedMembers = tribe.members.accepted.map((member) => member.id);
        const currentInvitedMembers = tribe.members.invited.map((member) => member.id);

        const filteredUsers = formattedUsers.filter(
          (member) =>
            member.role < requestUserRole &&
            currentAcceptedMembers.indexOf(member.id) === -1 &&
            currentInvitedMembers.indexOf(member.id) === -1,
        );
        const checkedUserIds = filteredUsers.map((user) => user.id);
        tribe.members.invited.push(...filteredUsers);

        const receivers =
          filteredUsers.length === usersToNotify.length
            ? usersToNotify
            : usersToNotify.filter((user) => checkedUserIds.indexOf(user._id.toString()));

        await notifyInvitedTribeUsers({ tribe, receivers, sender: requestUser });
      }

      tribe.markModified("members");
    }

    if (updatedMembersRoles) {
      let { formattedUsers, code, message } =
        (await checkUsers({
          membersWithRoles: updatedMembersRoles,
          requestUserId,
          ownerId: tribe.ownerId,
        })) || {};
      if (code) {
        return Base.newErrorResponse({
          response,
          code,
          message: `EditTribeController - update users, ${message}`,
        });
      }

      if (formattedUsers.length > 0) {
        const updatedAcceptedMembers = tribe.members.accepted;
        const updatedInvitedMembers = tribe.members.invited;
        const updatedRequestedMembers = tribe.members.requested;

        const filteredUsers = formattedUsers.filter((member) => member.role < requestUserRole);
        filteredUsers.forEach((user) => {
          let userUpdated = false;
          updatedAcceptedMembers.forEach((member) => {
            if (member.id === user.id) {
              member.role = user.role;
              userUpdated = true;
            }
          });
          if (!userUpdated) {
            updatedInvitedMembers.forEach((member) => {
              if (member.id === user.id) {
                member.role = user.role;
                userUpdated = true;
              }
            });
          }
          if (!userUpdated) {
            updatedRequestedMembers.forEach((member) => {
              if (member.id === user.id) {
                member.role = user.role;
                userUpdated = true;
              }
            });
          }
        });

        const coOwnersCount = updatedAcceptedMembers.filter(
          (member) => member.role === Const.tribeMemberRoleCoOwner,
        ).length;

        if (coOwnersCount > Const.tribeMaxCoOwners) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTribeMaxCoOwnerCountReached,
            message: `EditTribeController, maximum co-owners count reached`,
          });
        }

        tribe.members.accepted = updatedAcceptedMembers;
        tribe.members.invited = updatedInvitedMembers;
        tribe.members.requested = updatedRequestedMembers;
        tribe.markModified("members");
      }
    }

    if (removeMembers && typeof removeMembers === "string") {
      const removeUserIds = removeMembers.split(",").filter((id) => Utils.isValidObjectId(id));
      const acceptedUsersToRemove = tribe.members.accepted.filter(
        (member) => removeUserIds.includes(member.id) && member.role < requestUserRole,
      );
      const acceptedUserIdsToRemove = acceptedUsersToRemove.map((user) => user.id);

      if (acceptedUserIdsToRemove.length > 0) {
        const newAcceptedMembers = tribe.members.accepted.filter(
          (member) => !acceptedUserIdsToRemove.includes(member.id),
        );

        await notifyRemovedUsers({
          tribe,
          requestUser,
          removedUserIds: acceptedUserIdsToRemove,
          owner,
        });

        tribe.members.accepted = newAcceptedMembers;

        if (roomId) {
          room.users = newAcceptedMembers.map((member) => member.id);
          room.markModified("users");

          for (const memberId of acceptedUserIdsToRemove) {
            socketApi.leaveFrom(memberId, Const.chatTypeTribeGroupChat, roomId);

            await History.deleteOne({ chatId: roomId, userId: memberId });

            socketApi.emitToUser(memberId, "delete_room", {
              conversation: room.toObject(),
            });
          }
          room.roomUpdated = true;
        }
      }

      const newRequestedMembers = tribe.members.requested.filter(
        (member) => !removeUserIds.includes(member.id),
      );
      if (tribe.members.requested.length !== newRequestedMembers.length) {
        const newRequestedMemberIds = newRequestedMembers.map((member) => member.id);
        const removedRequestUsers = tribe.members.requested.filter(
          (member) => !newRequestedMemberIds.includes(member.id),
        );
        for (let i = 0; i < removedRequestUsers.length; i++) {
          const requestUserId = removedRequestUsers[i].id;
          await removeTribeRequestNotification({ tribeId, requestUserId });
        }
        tribe.members.requested = newRequestedMembers;
      }

      const invitedUsersToRemove = tribe.members.invited.filter(
        (member) => removeUserIds.includes(member.id) && member.role < requestUserRole,
      );
      const invitedUserIdsToRemove = invitedUsersToRemove.map((user) => user.id);

      if (invitedUserIdsToRemove.length > 0) {
        const newInvitedMembers = tribe.members.invited.filter(
          (member) => !invitedUserIdsToRemove.includes(member.id),
        );

        await removeUsersFromInvitedNotification({
          tribe,
          removedUserIds: invitedUserIdsToRemove,
        });

        tribe.members.invited = newInvitedMembers;
      }

      tribe.members.declined = tribe.members.declined.filter(
        (member) => !removeUserIds.includes(member.id),
      );

      tribe.markModified("members");
    }

    const imageDelete = deleteImage && typeof deleteImage === "string" && deleteImage === "1";

    if (!imageDelete && image && image.type.split("/")[0] === "image") {
      tribe.image = formatImageData(image);

      await fsp.copyFile(image.path, `${Config.uploadPath}/${tribe.image.nameOnServer}`);
      tribe.image.thumbnailName = await Utils.generateThumbnailFromImage(tribe.image.nameOnServer);

      room.avatar = await handleTribeImage(tribe.image);
      roomUpdated = true;
    }
    if (imageDelete) {
      tribe.image = {};
      room.avatar = { picture: {}, thumbnail: {} };
      roomUpdated = true;
    }

    await tribe.save();

    if (roomUpdated && roomId) {
      room.modified = Date.now();
      await room.save();
    }

    Base.successResponse(response, Const.responsecodeSucceed, { tribe: formatNewTribe(tribe) });
  } catch (error) {
    Base.newErrorResponse({ response, message: "EditTribeController", error });
  }
});

module.exports = router;
