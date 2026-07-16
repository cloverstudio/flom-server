"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { Business, BusinessMember, User, Notification, FlomMessage } = require("#models");
const Utils = require("#utils");
const Logics = require("#logics");

/**
 * @api {post} /api/v2/businesses/assistants/actions  Perform action on assistant flom_v1
 * @apiVersion 2.0.34
 * @apiName  Perform action on assistant
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to perform action on assistant. The action can be invite, accept, reject, revoke or change_role. The user can accept or reject the invite. The owner or manager of the business can send an invite, revoke the invite or change the role of the assistant.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Request body) {String} businessId  ID of the business
 * @apiParam (Request body) {String} action      Action to be performed (invite, accept, reject, revoke, change_role)
 * @apiParam (Request body) {String} [targetId]  ID of the invited user, send if action is "invite", "revoke" or "change_role"
 * @apiParam (Request body) {String} [role]      Role of the user to be invited or new role, send if action is "invite" or "change_role"
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345670376,
 *     "data": {
 *         "assistant": {
 *            "_id": "641d9c333478cf0d6a500547",
 *            "businessId": "6a4bb17dab58c78c74906cd6",
 *            "userId": "641d9c333478cf0d6a500547",
 *            "role": "helper",
 *            "status": "pending",
 *            "invitedById": "641d9c333478cf0d6a500547",
 *            "invitedAt": 1783345533103,
 *            "expiresAt": 1783940333103,
 *            "respondedAt": 1783345533103,
 *            "revokedAt": 1783345533103,
 *            "created": 1783345533103,
 *            "createdAt": "2026-07-06T13:45:33.118Z",
 *            "updatedAt": "2026-07-06T13:45:33.118Z",
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 443232 Invalid action
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 443215 Invalid role
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/assistants/actions", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId, action, role } = request.body;
    const targetId = request.body.targetId || user._id.toString();

    if (!["invite", "accept", "reject", "revoke", "change_role"].includes(action)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAction,
        message: "AssistantController, invalid action",
      });
    }

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "AssistantController, invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "AssistantController, business not found",
      });
    }

    if (["change_role", "invite"].includes(action) && !["helper", "manager"].includes(role)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongRole,
        message: "AssistantController, invalid role",
      });
    }

    if (["invite", "revoke", "change_role"].includes(action)) {
      const allowed = await Logics.checkBusinessPermissions({
        userId: user._id.toString(),
        business,
        action: "members:" + action + (action === "change_role" ? "" : "_" + role),
      });

      if (!allowed) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message:
            "AssistantController, update assistant - user is not allowed to update the assistant profile",
        });
      }
    }

    if (["revoke", "change_role"].includes(action)) {
      const existingAssistant = await BusinessMember.findOne({
        businessId,
        userId: targetId,
        status: { $in: ["pending", "accepted"] },
      }).lean();

      if (!existingAssistant) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message:
            "AssistantController, invalid action, target user is not an assistant of the business",
        });
      }
    }

    if (["accept", "reject"].includes(action)) {
      const existingAssistant = await BusinessMember.findOne({
        businessId,
        userId: targetId,
        status: "pending",
      }).lean();

      if (!existingAssistant) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message: "AssistantController, invalid action, no invited assistant found for the user",
        });
      }
    }

    let assistant = null;
    let newStatus = null;

    if (action === "invite") {
      const newAssistant = await BusinessMember.create({
        businessId,
        userId: targetId,
        role,
        status: "pending",
        invitedById: user._id.toString(),
        invitedAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // expires in 7 days
      });

      assistant = newAssistant.toObject();
    } else {
      const updateObject = {};
      const currentStatus = { status: "pending" };

      if (action === "accept") {
        newStatus = "accepted";
      } else if (action === "reject") {
        newStatus = "rejected";
      } else if (action === "revoke") {
        newStatus = "revoked";
        currentStatus.status = { $in: ["pending", "accepted"] };
      }

      if (newStatus) {
        updateObject.status = newStatus;

        if (action === "revoke") {
          updateObject.revokedAt = Date.now();
        } else {
          updateObject.respondedAt = Date.now();
        }
      }

      if (action === "change_role") {
        updateObject.role = role;
        currentStatus.status = { $in: ["pending", "accepted"] };
      }

      assistant = await BusinessMember.findOneAndUpdate(
        { businessId, userId: targetId, ...currentStatus },
        { $set: updateObject },
        { new: true, lean: true },
      );
    }

    if (action === "accept") {
      await Business.findByIdAndUpdate(businessId, { lastActive: Date.now() });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { assistant });

    if (action === "revoke" || action === "change_role" || action === "invite") {
      const targetUser = await User.findById(targetId).lean();

      sendNotifications({
        sender: user,
        receiver: targetUser,
        business,
        action,
        role,
        status: newStatus,
        inviteId: assistant._id.toString(),
      });
    } else if (action === "accept" || action === "reject") {
      const receiver = await User.findById(assistant.invitedById).lean();

      sendNotifications({
        sender: user,
        receiver,
        business,
        action,
        status: newStatus,
        inviteId: assistant._id.toString(),
      });
    }

    return;
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "AssistantController, update assistant",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/:businessId/assistants/me  Get own assistant invite info flom_v1
 * @apiVersion 2.0.34
 * @apiName  Get own assistant invite info
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to get user's own assistant invite info for the specified business.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1784139825061,
 *     "data": {
 *         "role": "helper",
 *         "status": "pending",
 *         "business": {
 *             "_id": "6a561fa0fd66633a96932d37",
 *             "chainId": "6a561fa0fd66633a96932d33",
 *             "subChainId": "6a561fa0fd66633a96932d35",
 *             "name": "Ivooooo",
 *             "description": "Sliakcaca",
 *             "status": "created",
 *             "verificationStatus": "unverified",
 *             "owner": {
 *                 "_id": "63e10fd117885e15aa47be24",
 *                 "phoneNumber": "+2348020000018"
 *             },
 *             "market": "NG",
 *             "tagIds": [],
 *             "created": 1784029088238,
 *             "lastActive": 1784029088238,
 *             "createdAt": "2026-07-14T11:38:08.238Z",
 *             "updatedAt": "2026-07-14T11:38:08.605Z",
 *             "__v": 0,
 *             "avatar": {
 *                 "nameOnServer": "eLSGiEjAvZFgJajFRsyvkCWXPpwFTrEO.JPG",
 *                 "mimeType": "image/jpeg",
 *                 "originalName": "IMG_NkiqP7Tl1784029087142.JPG",
 *                 "size": 457434,
 *                 "width": 1080,
 *                 "height": 1080,
 *                 "thumbnail": {
 *                     "nameOnServer": "eLSGiEjAvZFgJajFRsyvkCWXPpwFTrEO_thumb.JPG",
 *                     "mimeType": "image/jpeg",
 *                     "size": null,
 *                     "width": 300,
 *                     "height": 300
 *                 }
 *             }
 *         },
 *         "invitedBy": {
 *             "_id": "63e10fd117885e15aa47be24",
 *             "name": "met18",
 *             "created": 1675694033760,
 *             "phoneNumber": "+2348020000018",
 *             "userName": "met18",
 *             "avatar": {
 *                 "picture": {
 *                     "originalName": "thumb_d8COo7TH0Rsu_1724139206285.jpg",
 *                     "size": 108952,
 *                     "mimeType": "image/png",
 *                     "nameOnServer": "fJMk4huz89i2lqyghZIlOW6UYdzdb2Mk"
 *                 },
 *                 "thumbnail": {
 *                     "originalName": "thumb_d8COo7TH0Rsu_1724139206285.jpg",
 *                     "size": 86399,
 *                     "mimeType": "image/png",
 *                     "nameOnServer": "kUC8FvC6dz3tALwPpCSY5xuFET5y9H4o"
 *                 }
 *             }
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 443991 Invite not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/:businessId/assistants/me",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const { user } = request;
      const { businessId } = request.params;

      if (!businessId || !Utils.isValidObjectId(businessId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessId,
          message: "AssistantController, invalid businessId",
        });
      }

      const business = await Business.findById(businessId).lean();

      if (!business) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeBusinessNotFound,
          message: "AssistantController, business not found",
        });
      }

      const memberArray = await BusinessMember.find({ businessId, userId: user._id.toString() })
        .sort({ created: -1 })
        .lean();
      const member = memberArray[0];

      if (!member) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInviteNotFound,
          message: "AssistantController, invite not found for the user in the business",
        });
      }

      if (member.expiresAt < Date.now()) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInviteExpired,
          message: "AssistantController, invite has expired for the user in the business",
        });
      }

      const invitedBy = await User.findById(member.invitedById, {
        _id: 1,
        name: 1,
        userName: 1,
        phoneNumber: 1,
        created: 1,
        avatar: 1,
      }).lean();

      return Base.successResponse(response, Const.responsecodeSucceed, {
        role: member.role,
        status: member.status,
        business,
        invitedBy,
      });
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.httpCodeServerError,
        message: "AssistantController, update assistant",
        error,
      });
    }
  },
);

async function sendNotifications({
  sender,
  receiver,
  business,
  action = "invite",
  role = null,
  status = null,
  inviteId = null,
}) {
  try {
    let title, text, notificationType, pushType, messageType;

    switch (action) {
      case "invite":
        title = "Business assistant invite received";
        text = `${sender.userName} has invited you to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusinessAssistantInvite;
        pushType = Const.pushTypeBusinessAssistantInvite;
        messageType = Const.messageTypeBusinessAssistantInvite;
        break;
      case "revoke":
        title = "Business assistant invite revoked";
        text = `${sender.userName} has revoked your invitation to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusiness;
        pushType = Const.pushTypeBusiness;
        break;
      case "change_role":
        title = "Business assistant role changed";
        text = `${sender.userName} has changed your role as an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusiness;
        pushType = Const.pushTypeBusiness;
        break;
      case "accept":
        title = "Business assistant invite accepted";
        text = `${sender.userName} has accepted your invitation to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusiness;
        pushType = Const.pushTypeBusiness;
        break;
      case "reject":
        title = "Business assistant invite rejected";
        text = `${sender.userName} has rejected your invitation to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusiness;
        pushType = Const.pushTypeBusiness;
        break;
      default:
        logger.error(`sendNotifications, invalid action: ${action}`);
        return;
    }

    await Notification.create({
      title,
      text,
      receiverIds: [receiver._id.toString()],
      senderId: sender._id.toString(),
      referenceId: business._id.toString(),
      notificationType,
      created: Date.now(),
    });

    await Logics.sendFlomPush({
      newUser: sender,
      receiverUser: receiver,
      message: text,
      messageiOs: text,
      pushType,
      isMuted: false,
      attributes: { businessId: business._id.toString() },
      title,
    });

    if (action === "invite") {
      let roomId = "";

      if (sender.created < receiver.created) {
        roomId = `1-${sender._id.toString()}-${receiver?._id.toString()}`;
      } else {
        roomId = `1-${receiver?._id.toString()}-${sender._id.toString()}`;
      }

      const params = {
        isRecursiveCall: false,
        type: messageType,
        userID: sender._id.toString(),
        roomID: roomId,
        message: "",
        created: Date.now(),
        attributes: {
          role,
          status: "pending",
          inviteId,
          business: {
            _id: business._id.toString(),
            name: business.name,
            description: business.description,
            avatar: business.avatar,
          },
          invitedBy: {
            _id: sender._id.toString(),
            name: sender.name,
            userName: sender.userName,
            phoneNumber: sender.phoneNumber,
            created: sender.created,
          },
        },
      };

      await Logics.sendMessage(params);
    }

    if (status) {
      await FlomMessage.updateMany(
        {
          "attributes.inviteId": inviteId,
          type: Const.messageTypeBusinessAssistantInvite,
        },
        { "attributes.status": status },
      );
    }
  } catch (error) {
    logger.error(
      `sendNotifications, failed to send notification to target user: ${receiver._id.toString()}, error: ${
        error.message
      }`,
    );
  }
}

module.exports = router;
