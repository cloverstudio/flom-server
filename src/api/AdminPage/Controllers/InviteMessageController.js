"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { auth } = require("#middleware");
const { InviteMessage } = require("#models");

/**
 * @api {get} /api/v2/admin-page/invite-messages/ Get invite messages flom_v1
 * @apiVersion 2.0.10
 * @apiName Get invite messages flom_v1
 * @apiGroup WebAPI Admin page - Invite messages
 * @apiDescription Get invite messages
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1668165611059,
 *     "data": {
 *         "inviteMessages": [
 *             {
 *                 "_id": "6368d181059802673de49277",
 *                 "countryCode": "Default",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccbe24b35d0384eb9c51",
 *                 "countryCode": "HR",
 *                 "message": "Dođi na FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccd124b35d0384eb9c52",
 *                 "countryCode": "IT",
 *                 "message": "Andate a FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368d780059802673de49278",
 *                 "countryCode": "NG",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccfd24b35d0384eb9c53",
 *                 "countryCode": "RS",
 *                 "message": "Dođi na FLOM breeeeeeeeee!",
 *                 "__v": 0
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const inviteMessages = await InviteMessage.find({}).lean();

      const sortedMessages = sortMessages(inviteMessages);

      Base.successResponse(response, Const.responsecodeSucceed, {
        inviteMessages: sortedMessages,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "InviteMessageController, GET",
        error,
      });
    }
  },
);

/**
 * @api {post} /api/v2/admin-page/invite-messages/ Create invite message flom_v1
 * @apiVersion 2.0.10
 * @apiName Create invite message flom_v1
 * @apiGroup WebAPI Admin page - Invite messages
 * @apiDescription Create invite message
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam {String} countryCode    Country code of the country for which the invite message is intended
 * @apiParam {String} message        Invite message to be sent out in SMS
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1668165611059,
 *     "data": {
 *         "inviteMessages": [
 *             {
 *                 "_id": "6368d181059802673de49277",
 *                 "countryCode": "Default",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccbe24b35d0384eb9c51",
 *                 "countryCode": "HR",
 *                 "message": "Dođi na FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccd124b35d0384eb9c52",
 *                 "countryCode": "IT",
 *                 "message": "Andate a FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368d780059802673de49278",
 *                 "countryCode": "NG",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccfd24b35d0384eb9c53",
 *                 "countryCode": "RS",
 *                 "message": "Dođi na FLOM breeeeeeeeee!",
 *                 "__v": 0
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443690 No countryCode parameter
 * @apiError (Errors) 443691 Invalid countryCode parameter
 * @apiError (Errors) 443670 No message parameter
 * @apiError (Errors) 443692 Message with given countryCode already exists
 * @apiError (Errors) 443693 Create failed
 * @apiError (Errors) 4000007 Token not valid
 */

router.post(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { countryCode: tempCountryCode, message: tempMessage } = request.body;

      const { errorCode, errorMessage, countryCode, message } = handleInputs(
        tempCountryCode,
        tempMessage,
      );

      if (errorCode)
        return Base.newErrorResponse({
          response,
          code: errorCode,
          message: `InviteMessageController, POST - ${errorMessage}`,
        });

      const exists = await InviteMessage.findOne({ countryCode }).lean();
      if (exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInviteMessageAlreadyExists,
          message: `InviteMessageController, POST - Invite message with that countrycode already exists`,
        });
      }

      const inviteMessage = await InviteMessage.create({ countryCode, message });

      if (!inviteMessage) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreateInviteMessageFailed,
          message: "InviteMessageController, POST - create new invite message failed",
        });
      }

      const inviteMessages = await InviteMessage.find({}).lean();
      const sortedMessages = sortMessages(inviteMessages);

      Base.successResponse(response, Const.responsecodeSucceed, {
        inviteMessages: sortedMessages,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "InviteMessageController, POST",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/admin-page/invite-messages/:countryCode Update invite message flom_v1
 * @apiVersion 2.0.10
 * @apiName Update invite message flom_v1
 * @apiGroup WebAPI Admin page - Invite messages
 * @apiDescription Update invite message
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiParam {String} message        Invite message to be sent out in SMS
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1668165611059,
 *     "data": {
 *         "inviteMessages": [
 *             {
 *                 "_id": "6368d181059802673de49277",
 *                 "countryCode": "Default",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccbe24b35d0384eb9c51",
 *                 "countryCode": "HR",
 *                 "message": "Dođi na FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccd124b35d0384eb9c52",
 *                 "countryCode": "IT",
 *                 "message": "Andate a FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368d780059802673de49278",
 *                 "countryCode": "NG",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccfd24b35d0384eb9c53",
 *                 "countryCode": "RS",
 *                 "message": "Dođi na FLOM breeeeeeeeee!",
 *                 "__v": 0
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443690 No countryCode parameter
 * @apiError (Errors) 443691 Invalid countryCode parameter
 * @apiError (Errors) 443670 No message parameter
 * @apiError (Errors) 443694 Update failed
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const tempCountryCode = request.params.countryCode;
      const { message: tempMessage } = request.body;

      const { errorCode, errorMessage, countryCode, message } = handleInputs(
        tempCountryCode,
        tempMessage,
      );

      if (errorCode)
        return Base.newErrorResponse({
          response,
          code: errorCode,
          message: `InviteMessageController, PATCH - ${errorMessage}`,
        });

      const result = await InviteMessage.updateOne({ countryCode }, { message });

      if (result.nModified > 0) {
        const inviteMessages = await InviteMessage.find({}).lean();

        const sortedMessages = sortMessages(inviteMessages);

        return Base.successResponse(response, Const.responsecodeSucceed, {
          inviteMessages: sortedMessages,
        });
      } else
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUpdateInviteMessageFailed,
          message: "InviteMessageController, PATCH - update failed",
        });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "InviteMessageController, PATCH",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/invite-messages/:countryCode Delete invite message flom_v1
 * @apiVersion 2.0.10
 * @apiName Delete invite message flom_v1
 * @apiGroup WebAPI Admin page - Invite messages
 * @apiDescription Delete invite message
 *
 * @apiHeader {String} access-token Users unique access-token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1668165611059,
 *     "data": {
 *         "inviteMessages": [
 *             {
 *                 "_id": "6368d181059802673de49277",
 *                 "countryCode": "Default",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccbe24b35d0384eb9c51",
 *                 "countryCode": "HR",
 *                 "message": "Dođi na FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccd124b35d0384eb9c52",
 *                 "countryCode": "IT",
 *                 "message": "Andate a FLOM!",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368d780059802673de49278",
 *                 "countryCode": "NG",
 *                 "message": "Top up, Free calls and texts. Flom with people who matter to you today. Download now https://flom.app/invite/moshair",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "6368ccfd24b35d0384eb9c53",
 *                 "countryCode": "RS",
 *                 "message": "Dođi na FLOM breeeeeeeeee!",
 *                 "__v": 0
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443690 No countryCode parameter
 * @apiError (Errors) 443691 Invalid countryCode parameter
 * @apiError (Errors) 443695 Delete failed
 * @apiError (Errors) 4000007 Token not valid
 */

router.delete(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const countryCode = request.params.countryCode;

      if (!countryCode) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoCountryCodeParameter,
          message: `InviteMessageController, DELETE - no country code`,
        });
      }

      if (!countries[countryCode]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: `InviteMessageController, DELETE - invalid country code`,
        });
      }

      const result = await InviteMessage.deleteOne({ countryCode });

      if (result.ok) {
        const inviteMessages = await InviteMessage.find({}).lean();
        const sortedMessages = sortMessages(inviteMessages);

        return Base.successResponse(response, Const.responsecodeSucceed, {
          inviteMessages: sortedMessages,
        });
      } else
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeDeleteInviteMessageFailed,
          message: "InviteMessageController, DELETE - delete failed",
        });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "InviteMessageController, DELETE",
        error,
      });
    }
  },
);

function handleInputs(tempCountryCode, tempMessage) {
  if (!tempCountryCode)
    return {
      errorCode: Const.responsecodeNoCountryCodeParameter,
      errorMessage: `no country code`,
    };

  if (!countries[tempCountryCode] && tempCountryCode !== "Default")
    return {
      errorCode: Const.responsecodeInvalidCountryCode,
      errorMessage: `invalid country code`,
    };

  if (!tempMessage)
    return {
      errorCode: Const.responsecodeNoMessageParameter,
      errorMessage: `no message`,
    };

  return { errorCode: null, countryCode: tempCountryCode, message: tempMessage };
}

function sortMessages(inviteMessages) {
  let defaultMessage = {};
  const rest = [];

  for (let i = 0; i < inviteMessages.length; i++) {
    if (inviteMessages[i].countryCode === "Default") defaultMessage = inviteMessages[i];
    else rest.push(inviteMessages[i]);
  }

  rest.sort((a, b) => {
    if (a.countryCode > b.countryCode) return 1;
    else if (a.countryCode < b.countryCode) return -1;
    else return 0;
  });

  return [defaultMessage, ...rest];
}

module.exports = router;
