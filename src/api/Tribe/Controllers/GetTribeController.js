"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Room, Tribe, History, User } = require("#models");
const { formatTribeForMember, formatTribeForOwner, formatTribeForOthers } = require("../helpers");

/**
 * @api {get} /api/v2/tribes/{tribeId} Get tribe by id
 * @apiVersion 2.0.10
 * @apiName Get tribe by id
 * @apiGroup WebAPI Tribe
 * @apiDescription This API is called for fetching tribe
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1647243937288,
 *   "data": {
 *     "tribe": {
 *       "_id": "61f9245990b8871a936deecb",
 *       "members": {
 *         "accepted": [
 *           {
 *             "_id": "6139cd7848c6c40f4dffb04a",
 *             "role": 1,
 *             "created": 1631178104916,
 *             "phoneNumber": "+385989224520",
 *             "userName": "ab",
 *             "userStatus": "accepted"
 *           }
 *         ],
 *         "declined": [],
 *         "requested": [],
 *         "invited": [
 *           {
 *             "_id": "6101140dcbf8f756d06168fd",
 *             "role": 1,
 *             "created": 1627460621199,
 *             "phoneNumber": "+385976376676",
 *             "userName": "ivoperic",
 *             "avatar": {
 *               "picture": {
 *                 "originalName": "imageA_1641297676.jpg",
 *                 "size": 762804,
 *                 "mimeType": "image/png",
 *                 "nameOnServer": "hgLDRBI3P95M7XbXeDGr9qJHjk0oW1JP"
 *               },
 *               "thumbnail": {
 *                 "originalName": "imageA_1641297676.jpg",
 *                 "size": 106000,
 *                 "mimeType": "image/png",
 *                 "nameOnServer": "FdU5VfYwrqX4Vxdk3sS4fqi3Fi4bIvj5"
 *               }
 *             },
 *             "userStatus": "invited"
 *           },
 *           {
 *             "_id": "6041f57eb0ff5e3dca6f3bb5",
 *             "role": 1,
 *             "created": 1614935422364,
 *             "phoneNumber": "+2348020000001",
 *             "userName": "flom1",
 *             "userStatus": "invited"
 *           }
 *         ]
 *       },
 *       "created": 1643717721609,
 *       "name": "gigigugu",
 *       "description": "Gk",
 *       "ownerId": "6034e1c050d293417149305f",
 *       "image": {},
 *       "numberOfMembers": 1,
 *       "roomId": "6034e1c050d2934171493051",
 *       "userStatus": "accepted",
 *       "owner": {
 *         "_id": "5f7ee464a283bc433d9d722f",
 *         "name": "mdragic",
 *         "phoneNumber": "+2348020000007",
 *         "avatar": {
 *           "picture": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 4698848,
 *             "mimeType": "image/png",
 *             "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *           },
 *           "thumbnail": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 97900,
 *             "mimeType": "image/png",
 *             "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *           }
 *         },
 *         "created": 1602151524372
 *       }
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
 * @apiError (Errors) 443473 Bad id parameter
 * @apiError (Errors) 443474 Tribe not found
 */

router.get(
  "/:tribeId",
  auth({
    allowUser: true,
    allowAdmin: true,
    role: Const.Role.ADMIN,
  }),
  async (request, response) => {
    try {
      const userId = request.user._id.toString();

      const tribeId = request.params.tribeId;
      if (!Utils.isValidObjectId(tribeId))
        return Base.newErrorResponse({
          response,
          message: `GetTribeController, bad tribe id`,
          code: Const.responsecodeTribeBadId,
        });

      const tribe = await Tribe.findById(tribeId).lean();
      if (!tribe)
        return Base.newErrorResponse({
          response,
          message: `GetTribeController, no tribe found`,
          code: Const.responsecodeTribeNotFound,
        });

      const populateMembers = async (members) => {
        const membersFormatted = { accepted: [], declined: [], requested: [], invited: [] };
        const memberRoles = new Map();
        Object.values(members).forEach((members) =>
          members.forEach((member) => memberRoles.set(member.id, member.role)),
        );

        const memberIds = [...memberRoles.keys()];
        if (memberIds.length === 0) {
          return membersFormatted;
        }

        const users = await User.find(
          { _id: { $in: memberIds } },
          {
            userName: 1,
            avatar: 1,
            phoneNumber: 1,
            bankAccounts: 1,
            created: 1,
          },
        ).lean();

        if (users.length !== 0) {
          const memberKeys = Object.keys(members);
          for (let i = 0; i < memberKeys.length; i++) {
            const key = memberKeys[i];
            const userStatus = Const.tribeUserStatus[key];
            if (members[key].length > 0) {
              members[key].forEach((member) => {
                const { id, ...rest } = member;
                const { _id, ...user } = users.find((user) => user._id.toString() == member.id);
                membersFormatted[key].push({ ...rest, _id: _id.toString(), ...user, userStatus });
              });
            }
          }
        }
        return membersFormatted;
      };

      let formattedTribe, owner;
      if (userId === tribe.ownerId) {
        formattedTribe = formatTribeForOwner(tribe);
        formattedTribe.members = await populateMembers(formattedTribe.members);
        owner = request.user;
      } else {
        const acceptedUser = tribe.members.accepted.find((member) => member.id === userId);
        if (acceptedUser) {
          if (acceptedUser.role === Const.tribeMemberRoleCoOwner) {
            formattedTribe = formatTribeForOwner(tribe);
            formattedTribe.members = await populateMembers(formattedTribe.members);
          } else {
            formattedTribe = formatTribeForMember(tribe);
            const formattedMembers = await populateMembers(formattedTribe.members);
            formattedTribe.members.accepted = formattedMembers.accepted;
          }
        } else if (tribe.members.requested.find((member) => member.id === userId)) {
          formattedTribe = formatTribeForOthers(tribe, Const.tribeUserStatus.requested);
        } else if (tribe.members.invited.find((member) => member.id === userId)) {
          formattedTribe = formatTribeForOthers(tribe, Const.tribeUserStatus.invited);
        } else {
          if (tribe.isHidden === true) {
            return Base.newErrorResponse({
              response,
              message: `GetTribeController, no tribe found, tribe is hidden`,
              code: Const.responsecodeTribeNotFound,
            });
          }

          formattedTribe = formatTribeForOthers(tribe, Const.tribeUserStatus.declined);
        }
        owner = await User.findOne(
          { _id: tribe.ownerId },
          { name: 1, phoneNumber: 1, bankAccounts: 1, avatar: 1, created: 1 },
        ).lean();
      }

      formattedTribe.owner = {
        _id: owner._id.toString(),
        name: owner.name,
        phoneNumber: owner.phoneNumber,
        bankAccounts: owner.bankAccounts,
        avatar: owner.avatar,
        created: owner.created,
      };

      Base.successResponse(response, Const.responsecodeSucceed, { tribe: formattedTribe });
    } catch (error) {
      Base.newErrorResponse({ response, message: "GetTribeController", error });
    }
  },
);

async function updateTribes() {
  const tribes = await Tribe.find({}, { _id: 1, members: 1 }).lean();

  for (let i = 0; i < tribes.length; i++) {
    const tribe = tribes[i];
    const members = tribe.members;

    for (const key in members) {
      if (members[key].length > 0) {
        members[key] = members[key].map((member) => {
          if (member?.role) {
            return member;
          } else {
            return {
              id: member,
              role: Const.tribeMemberRoleMember,
            };
          }
        });
      }
    }
    tribe.members = members;

    await Tribe.updateOne({ _id: tribe._id }, { $set: { members } });
  }
}

module.exports = router;
