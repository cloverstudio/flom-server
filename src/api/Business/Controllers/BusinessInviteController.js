"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const {
  Business,
  BusinessMember,
  BusinessInvite,
  User,
  Notification,
  FlomMessage,
} = require("#models");
const Utils = require("#utils");
const Logics = require("#logics");

/**
 * @api {get} /api/v2/businesses/invites/:inviteId/accept  Accept business invite flom_v1
 * @apiVersion 2.0.34
 * @apiName  Accept business invite
 * @apiGroup WebAPI Business Invite
 * @apiDescription  API which is called to accept a business invite. Can be used by the invited user.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1784139825061,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443991 Invalid invite id
 * @apiError (Errors) 443992 Invite not found
 * @apiError (Errors) 443858 User is not allowed to accept this invite
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:inviteId/accept", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { inviteId } = request.params;

    if (!inviteId || !Utils.isValidObjectId(inviteId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidInviteId,
        message: "BusinessInviteController, accept invite, invalid inviteId",
      });
    }

    const invite = await BusinessInvite.findById(inviteId).lean();

    if (!invite) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteNotFound,
        message: "BusinessInviteController, accept invite, invite not found",
      });
    }

    if (userId !== invite.userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, accept invite - user is not allowed to accept this invite",
      });
    }

    if (invite.status === "expired" || invite.expiresAt < Date.now()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteExpired,
        message: "BusinessInviteController, accept invite - invite has expired",
      });
    }

    const member = await BusinessMember.findOne({ inviteId }).lean();

    if (!member) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, accept invite - user is not a member of the business, cannot accept invite",
      });
    }

    if (member.status !== "invited") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, accept invite - user is not in invited status, cannot accept invite",
      });
    }

    const updatedInvite = await BusinessInvite.findByIdAndUpdate(
      inviteId,
      { status: "accepted", respondedAt: Date.now() },
      { new: true },
    );

    await BusinessMember.findByIdAndUpdate(member._id, { status: "active" });

    Base.successResponse(response, Const.responsecodeSucceed, {});

    sendNotifications({
      sender: user,
      receiverId: invite.invitedById,
      businessId: invite.businessId,
      action: "accept",
      invite: updatedInvite,
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessInviteController, accept invite",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/invites/:inviteId/reject  Reject business invite flom_v1
 * @apiVersion 2.0.34
 * @apiName  Reject business invite
 * @apiGroup WebAPI Business Invite
 * @apiDescription  API which is called to reject a business invite. Can be used by the invited user.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1784139825061,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443991 Invalid invite id
 * @apiError (Errors) 443992 Invite not found
 * @apiError (Errors) 443858 User is not allowed to reject this invite
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:inviteId/reject", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { inviteId } = request.params;

    if (!inviteId || !Utils.isValidObjectId(inviteId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidInviteId,
        message: "BusinessInviteController, reject invite, invalid inviteId",
      });
    }

    const invite = await BusinessInvite.findById(inviteId).lean();

    if (!invite) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteNotFound,
        message: "BusinessInviteController, reject invite, invite not found",
      });
    }

    if (userId !== invite.userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, reject invite - user is not allowed to reject this invite",
      });
    }

    if (invite.status === "expired" || invite.expiresAt < Date.now()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteExpired,
        message: "BusinessInviteController, reject invite - invite has expired",
      });
    }

    const member = await BusinessMember.findOne({ inviteId }).lean();

    if (!member) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, reject invite - user is not a member of the business, cannot reject invite",
      });
    }

    if (member.status !== "invited") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, reject invite - user is not in invited status, cannot reject invite",
      });
    }

    const updatedInvite = await BusinessInvite.findByIdAndUpdate(
      inviteId,
      { status: "rejected", respondedAt: Date.now() },
      { new: true },
    );

    await BusinessMember.findByIdAndDelete(member._id);

    Base.successResponse(response, Const.responsecodeSucceed, {});

    sendNotifications({
      sender: user,
      receiverId: invite.invitedById,
      businessId: invite.businessId,
      action: "reject",
      invite: updatedInvite,
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessInviteController, reject invite",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/invites/:inviteId/revoke  Revoke business invite flom_v1
 * @apiVersion 2.0.34
 * @apiName  Revoke business invite
 * @apiGroup WebAPI Business Invite
 * @apiDescription  API which is called to revoke a business invite. Can be used by business owner and helpers.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1784139825061,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443991 Invalid invite id
 * @apiError (Errors) 443992 Invite not found
 * @apiError (Errors) 443858 User is not allowed to revoke this invite
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:inviteId/revoke", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { inviteId } = request.params;

    if (!inviteId || !Utils.isValidObjectId(inviteId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidInviteId,
        message: "BusinessInviteController, revoke invite, invalid inviteId",
      });
    }

    const invite = await BusinessInvite.findById(inviteId).lean();

    if (!invite) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteNotFound,
        message: "BusinessInviteController, revoke invite, invite not found",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      businessId: invite.businessId,
      action: "members:revoke_" + invite.role,
    });

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, revoke invite - user is not allowed to revoke this invite",
      });
    }

    if (invite.status === "expired" || invite.expiresAt < Date.now()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteExpired,
        message: "BusinessInviteController, revoke invite - invite has expired",
      });
    }

    const member = await BusinessMember.findOne({ inviteId }).lean();

    if (!member) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, revoke invite - invited user is not a member of the business, cannot revoke invite",
      });
    }

    if (member.status !== "invited") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessInviteController, revoke invite - invited user is not in invited status, cannot revoke invite",
      });
    }

    const updatedInvite = await BusinessInvite.findByIdAndUpdate(
      inviteId,
      { status: "revoked", revokedAt: Date.now() },
      { new: true },
    );

    await BusinessMember.findByIdAndDelete(member._id);

    Base.successResponse(response, Const.responsecodeSucceed, {});

    sendNotifications({
      sender: user,
      receiverId: invite.userId,
      businessId: invite.businessId,
      action: "revoke",
      invite: updatedInvite,
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessInviteController, revoke invite",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/invites/:inviteId  Get business invite info flom_v1
 * @apiVersion 2.0.34
 * @apiName  Get business invite info
 * @apiGroup WebAPI Business Invite
 * @apiDescription  API which is called to get invite info. Can be used by invited user or business owner and helpers.
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
 *             "payoutStatus": "disabled",
 *             "idStatus": "unverified",
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
 * @apiError (Errors) 443991 Invalid invite id
 * @apiError (Errors) 443992 Invite not found
 * @apiError (Errors) 443858 User is not allowed to access this invite
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/:inviteId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { inviteId } = request.params;

    if (!inviteId || !Utils.isValidObjectId(inviteId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidInviteId,
        message: "BusinessInviteController, get invite, invalid inviteId",
      });
    }

    const invite = await BusinessInvite.findById(inviteId).lean();

    if (!invite) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteNotFound,
        message: "BusinessInviteController, get invite, invite not found",
      });
    }

    const members = await BusinessMember.find({ businessId: invite.businessId }).lean();

    if (!members.find((m) => m.userId === userId && ["invited", "active"].includes(m.status))) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "BusinessInviteController, get invite, user not allowed",
      });
    }

    const business = await Business.findById(invite.businessId).lean();

    const invitedBy = await User.findById(invite.invitedById, {
      _id: 1,
      name: 1,
      userName: 1,
      created: 1,
      phoneNumber: 1,
      avatar: 1,
    }).lean();

    return Base.successResponse(response, Const.responsecodeSucceed, {
      role: invite.role,
      status: invite.status,
      business,
      invitedBy,
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessInviteController, get invite",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/businesses/invites/send  Send business invite flom_v1
 * @apiVersion 2.0.34
 * @apiName  Send business invite
 * @apiGroup WebAPI Business Invite
 * @apiDescription  API which is called to send a business invite. Can be used by business owner and helpers.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Request body) {String} businessId  ID of the business
 * @apiParam (Request body) {String} userId      ID of the user to be invited
 * @apiParam (Request body) {String} role        Role of the user to be invited ("helper" or "manager")
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1784139825061,
 *     "data": {
 *       "invite": {
 *         "_id": "6a561fa0fd66633a96932d37",
 *         "businessId": "6a561fa0fd66633a96932d33",
 *         "userId": "6a561fa0fd66633a96932d35",
 *         "role": "helper",
 *         "status": "pending", // pending, accepted, rejected, revoked, expired
 *         "invitedById": "6a561fa0fd66633a96932d36",
 *         "invitedAt": 1784029088238,
 *         "expiresAt": 1784633888238,
 *         "created": 1784029088238
 *      }
 *    }
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
 * @apiError (Errors) 443040 User not found
 * @apiError (Errors) 443215 Invalid role
 * @apiError (Errors) 443243 User is already a member of the business
 * @apiError (Errors) 443994 Invite already exists
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/send", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { businessId, userId: targetId, role } = request.body;

    if (!["helper", "manager"].includes(role)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongRole,
        message: "BusinessInviteController, send invite, invalid role",
      });
    }

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "BusinessInviteController, send invite, invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "BusinessInviteController, send invite, business not found",
      });
    }

    const target = await User.findById(targetId).lean();

    if (!target) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: "BusinessInviteController, send invite, target user not found",
      });
    }

    const existingMember = await BusinessMember.findOne({ businessId, userId: targetId }).lean();

    if (existingMember) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserAlreadyMember,
        message: "BusinessInviteController, send invite, user is already a member of the business",
      });
    }

    const existingInvite = await BusinessInvite.findOne({
      businessId,
      userId: targetId,
      status: { $in: ["pending"] },
    }).lean();

    if (existingInvite) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInviteAlreadyExists,
        message: "BusinessInviteController, send invite, pending invite already exists",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      business,
      action: "members:invite_" + role,
    });

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "BusinessInviteController, send invite - user is not allowed to invite this role",
      });
    }

    const invite = await BusinessInvite.create({
      businessId,
      userId: targetId,
      role,
      status: "pending",
      invitedById: userId,
      invitedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // expires in 7 days
    });

    await BusinessMember.create({
      businessId,
      userId: targetId,
      role,
      status: "invited",
      inviteId: invite._id.toString(),
    });

    Base.successResponse(response, Const.responsecodeSucceed, { invite: invite.toObject() });

    sendNotifications({
      sender: user,
      receiver: target,
      business,
      action: "send_invite",
      invite,
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessInviteController, send invite",
      error,
    });
  }
});

async function sendNotifications({
  sender,
  receiver,
  receiverId,
  business,
  businessId,
  action,
  invite,
}) {
  try {
    receiver = receiver || (await User.findById(receiverId).lean());
    business = business || (await Business.findById(businessId).lean());

    if (!receiver) {
      logger.error(
        `BusinessInviteController sendNotifications, failed to send notification, target user not found, receiverId: ${receiverId}`,
      );
      return;
    }

    if (!business) {
      logger.error(
        `BusinessInviteController sendNotifications, failed to send notification, business not found, businessId: ${businessId}`,
      );
      return;
    }

    let title, text, notificationType, pushType, messageType;

    switch (action) {
      case "send_invite":
        title = "Business assistant invite received";
        text = `${sender.userName} has invited you to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusinessAssistantInvite;
        pushType = Const.pushTypeBusinessAssistantInvite;
        messageType = Const.messageTypeBusinessAssistantInvite;
        break;
      case "revoke":
        title = "Business assistant invite revoked";
        text = `${sender.userName} has revoked your invitation to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusinessAssistantInvite;
        pushType = Const.pushTypeBusinessAssistantInvite;
        break;
      case "accept":
        title = "Business assistant invite accepted";
        text = `${sender.userName} has accepted your invitation to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusinessAssistantInvite;
        pushType = Const.pushTypeBusinessAssistantInvite;
        break;
      case "reject":
        title = "Business assistant invite rejected";
        text = `${sender.userName} has rejected your invitation to be an assistant for the business ${business.name}.`;
        notificationType = Const.notificationTypeBusinessAssistantInvite;
        pushType = Const.pushTypeBusinessAssistantInvite;
        break;
      default:
        logger.error(`BusinessInviteController sendNotifications, invalid action: ${action}`);
        return;
    }

    await Notification.create({
      title,
      text,
      receiverIds: [receiver._id.toString()],
      senderId: sender._id.toString(),
      referenceId: invite._id.toString(),
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
      attributes: { inviteId: invite._id.toString() },
      title,
    });

    if (action === "send_invite") {
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
          role: invite.role,
          status: invite.status,
          inviteId: invite._id.toString(),
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

    if (invite) {
      await FlomMessage.updateMany(
        {
          "attributes.inviteId": invite._id.toString(),
          type: Const.messageTypeBusinessAssistantInvite,
        },
        { "attributes.status": invite.status },
      );
    }
  } catch (error) {
    logger.error(
      `BusinessInviteController sendNotifications, failed to send notification, error: ${error.message}`,
    );
  }
}

module.exports = router;
