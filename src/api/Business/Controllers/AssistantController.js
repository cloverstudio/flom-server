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
 * @apiDescription  API which is called to perform action on assistant. The action can be change_role, remove, deactivate, activate. Only owner can perform these actions on assistants.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Request body) {String} businessId  ID of the business
 * @apiParam (Request body) {String} action      Action to be performed (change_role, remove, deactivate, activate)
 * @apiParam (Request body) {String} targetId    ID of the assistant
 * @apiParam (Request body) {String} [role]      New role of the assistant, send if action is "change_role"
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345670376,
 *     "data": {}
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
    const { businessId, action, role, targetId } = request.body;

    if (!["remove", "deactivate", "activate", "change_role"].includes(action)) {
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

    if (action === "change_role" && !["helper", "manager"].includes(role)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongRole,
        message: "AssistantController, invalid role",
      });
    }

    if (user._id.toString() !== business.owner._id) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "AssistantController, update assistant - user is not allowed to update the assistant profile",
      });
    }

    const existingAssistant = await BusinessMember.findOne({ businessId, userId: targetId }).lean();

    if (!existingAssistant) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAction,
        message:
          "AssistantController, invalid action, target user is not an assistant of the business",
      });
    }

    if (existingAssistant.role === "owner") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "AssistantController, invalid action, target user is the owner of the business",
      });
    }

    if (action === "remove") {
      await BusinessMember.deleteOne({ businessId, userId: targetId });
    } else if (action === "deactivate") {
      await BusinessMember.updateOne({ businessId, userId: targetId }, { status: "inactive" });
    } else if (action === "activate") {
      await BusinessMember.updateOne({ businessId, userId: targetId }, { status: "active" });
    } else if (action === "change_role") {
      await BusinessMember.updateOne({ businessId, userId: targetId }, { role });
    }

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "AssistantController, update assistant",
      error,
    });
  }
});

module.exports = router;
