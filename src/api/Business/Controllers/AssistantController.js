"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { Business, User, Notification } = require("#models");
const Utils = require("#utils");
const Logics = require("#logics");

/**
 * @api {post} /api/v2/businesses/assistants  Add assistant flom_v1
 * @apiVersion 2.0.34
 * @apiName  Add assistant
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to add a new assistant. Only owner of the business can add an assistant. The invite is sent to the user with the given userId. The user will receive a notification and can accept or reject the invite.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Request body) {String} businessId  ID of the business
 * @apiParam (Request body) {String} targetId    ID of the user to be invited
 * @apiParam (Request body) {String} role        Role of the user to be invited
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345670376,
 *     "data": {
 *         "business": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "phoneNumber": "+385958710207",
 *             "whatsAppConnected": false,
 *             "verificationStatus": "unverified",
 *             "schedule": {
 *                 "weekly": {
 *                     "0": {
 *                         "periods": []
 *                     },
 *                     "1": {
 *                         "periods": []
 *                     },
 *                     "2": {
 *                         "periods": []
 *                     },
 *                     "3": {
 *                         "periods": []
 *                     },
 *                     "4": {
 *                         "periods": []
 *                     },
 *                     "5": {
 *                         "periods": []
 *                     },
 *                     "6": {
 *                         "periods": []
 *                     }
 *                 },
 *                 "exceptions": []
 *             },
 *             "assistants": [],
 *             "created": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "__v": 0
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
 * @apiError (Errors) 443391 File not found
 * @apiError (Errors) 443392 File type not supported
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId, targetId, role = "" } = request.body;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "AssistantInviteController, invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business || business.owner._id !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "AssistantInviteController, business not found or user is not the owner",
      });
    }

    const targetUser = await User.findById(targetId).lean();

    if (!targetUser || targetUser.isDeleted?.value) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: "AssistantInviteController, target user not found",
      });
    }

    if (!["helper", "manager"].includes(role)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidRole,
        message: "AssistantInviteController, invalid role",
      });
    }

    const existingAssistant = business.assistants?.find((assistant) => assistant._id === targetId);

    if (existingAssistant && ["pending", "accepted"].includes(existingAssistant.status)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserAlreadyAssistant,
        message: "AssistantInviteController, target user is already an assistant or invited",
      });
    }

    const businessUpdateResult = await Business.findByIdAndUpdate(
      { _id: businessId },
      {
        $push: {
          assistants: {
            _id: targetId,
            phoneNumber: targetUser.phoneNumber,
            role,
            status: "pending",
            invitedById: user._id.toString(),
            invitedAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // expires in 7 days
          },
        },
      },
      { new: true, lean: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      business: businessUpdateResult,
    });

    sendNotifications({ receiver: targetUser, sender: user, business });

    return;
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "AssistantInviteController, add assistant",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/businesses/assistants  Update assistant flom_v1
 * @apiVersion 2.0.34
 * @apiName  Update assistant
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to update an assistant. The action can be accept, reject, revoke or change_role. The user can accept or reject the invite. The owner of the business can revoke the invite or change the role of the assistant.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Request body) {String} businessId  ID of the business
 * @apiParam (Request body) {String} action      Action to be performed on the invite (accept, reject, revoke, change_role)
 * @apiParam (Request body) {String} [targetId]  ID of the invited user, send if action is "revoke" or "change_role"
 * @apiParam (Request body) {String} [newRole]   New role of the user to be invited, send if action is "change_role"
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345670376,
 *     "data": {
 *         "business": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "address": {
 *                 "country": "Croatia",
 *                 "countryCode": "HR",
 *                 "city": "Split",
 *                 "road": "Jobova",
 *                 "houseNumber": "14",
 *                 "postCode": "21000",
 *                 "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *             },
 *             "phoneNumber": "+385958710207",
 *             "whatsAppConnected": false,
 *             "verificationStatus": "unverified",
 *             "schedule": {
 *                 "weekly": {
 *                     "0": {
 *                         "periods": []
 *                     },
 *                     "1": {
 *                         "periods": []
 *                     },
 *                     "2": {
 *                         "periods": []
 *                     },
 *                     "3": {
 *                         "periods": []
 *                     },
 *                     "4": {
 *                         "periods": []
 *                     },
 *                     "5": {
 *                         "periods": []
 *                     },
 *                     "6": {
 *                         "periods": []
 *                     }
 *                 },
 *                 "exceptions": []
 *             },
 *             "assistants": [],
 *             "created": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "__v": 0
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
 * @apiError (Errors) 443391 File not found
 * @apiError (Errors) 443392 File type not supported
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId, action, newRole } = request.body;
    const targetId = request.body.targetId || user._id.toString();

    if (!["accept", "reject", "revoke", "change_role"].includes(action)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAction,
        message: "AssistantInviteController, invalid action",
      });
    }

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "AssistantInviteController, invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "AssistantInviteController, business not found",
      });
    }

    if (["revoke", "change_role"].includes(action)) {
      if (business.owner._id !== user._id.toString()) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message:
            "AssistantInviteController, invalid action, user is not the owner of the business",
        });
      }

      if (!business.assistants?.find((assistant) => assistant._id === targetId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message:
            "AssistantInviteController, invalid action, target user is not an assistant of the business",
        });
      }
    }

    if (["accept", "reject"].includes(action)) {
      const existingAssistant = business.assistants?.find(
        (assistant) => assistant._id === user._id.toString(),
      );

      if (!existingAssistant) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message: "AssistantInviteController, invalid action, user is not invited user",
        });
      }

      if (existingAssistant.status !== "pending") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAction,
          message: "AssistantInviteController, invalid action, invite is not pending",
        });
      }
    }

    if (action === "change_role" && !["helper", "manager"].includes(newRole)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidRole,
        message: "AssistantInviteController, invalid new role",
      });
    }

    const updateObject = {};

    let newStatus = "";
    if (action === "accept") {
      newStatus = "accepted";
    } else if (action === "reject") {
      newStatus = "rejected";
    } else if (action === "revoke") {
      newStatus = "revoked";
    }

    if (newStatus) {
      updateObject["assistants.$.status"] = newStatus;

      if (action === "revoke") {
        updateObject["assistants.$.revokedAt"] = Date.now();
      } else {
        updateObject["assistants.$.respondedAt"] = Date.now();
      }
    }

    if (action === "change_role") {
      updateObject["assistants.$.role"] = newRole;
    }

    const updatedBusiness = await Business.findOneAndUpdate(
      { _id: businessId, "assistants._id": targetId },
      { $set: updateObject },
      { new: true, lean: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed, { business: updatedBusiness });

    if (action === "revoke" || action === "change_role") {
      const targetUser = await User.findById(targetId).lean();

      sendNotifications({
        sender: user,
        receiver: targetUser,
        business,
        action,
      });
    } else if (action === "accept" || action === "reject") {
      const owner = await User.findById(business.owner._id).lean();

      sendNotifications({
        sender: user,
        receiver: owner,
        business,
        action,
      });
    }

    return;
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "AssistantInviteController, update assistant",
      error,
    });
  }
});

async function sendNotifications({ sender, receiver, business, action = "invite" }) {
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
          businessId: business._id.toString(),
        },
      };

      await Logics.sendMessage(params);
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
