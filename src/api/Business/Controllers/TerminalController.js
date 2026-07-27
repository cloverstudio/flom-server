"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, businessTags, countries } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const Logics = require("#logics");
const { User, Outlet, Terminal, TerminalOperatorReference, BusinessMember } = require("#models");

/**
 * @api {post} /api/v2/businesses/terminals/signin  Sign in owner or assistant into a terminal flom_v1
 * @apiVersion 2.0.34
 * @apiName  Sign in owner or assistant into a terminal
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to sign in owner or assistant into a terminal.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Request body) {String} terminalId  ID of the terminal
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
 * @apiError (Errors) 443983 Invalid terminal id
 * @apiError (Errors) 443984 Terminal not found
 * @apiError (Errors) 443985 Terminal already in use
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/signin", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { terminalId } = request.body;

    if (!terminalId || !Utils.isValidObjectId(terminalId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTerminalId,
        message: "TerminalController, sign in - invalid terminalId",
      });
    }

    const terminal = await Terminal.findById(terminalId).lean();

    if (!terminal) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTerminalNotFound,
        message: "TerminalController, sign in, terminal not found",
      });
    }

    const ref = await TerminalOperatorReference.findOne({
      terminalId,
      endTimeStamp: { $exists: false },
    }).lean();

    if (ref) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTerminalAlreadyInUse,
        message: "TerminalController, sign in, terminal is already in use",
      });
    }

    const members = await BusinessMember.find({ businessId: terminal.businessId }).lean();

    const allowed = members.some((m) => m.userId.toString() === userId && m.status === "active");

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "TerminalController, sign in - user is not allowed to sign in to the terminal",
      });
    }

    await TerminalOperatorReference.create({
      terminalId,
      chainId: terminal.chainId,
      subChainId: terminal.subChainId,
      businessId: terminal.businessId,
      outletId: terminal.outletId,
      userId,
      startTimeStamp: Date.now(),
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "TerminalController, sign in",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/businesses/terminals/signout  Sign out owner or assistant from a terminal flom_v1
 * @apiVersion 2.0.34
 * @apiName  Sign out owner or assistant from a terminal
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to sign out owner or assistant from a terminal.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Request body) {String} terminalId  ID of the terminal
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
 * @apiError (Errors) 443983 Invalid terminal id
 * @apiError (Errors) 443984 Terminal not found
 * @apiError (Errors) 443986 Terminal not in use
 * @apiError (Errors) 443987 User not active on terminal
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/signout", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { terminalId } = request.body;

    if (!terminalId || !Utils.isValidObjectId(terminalId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTerminalId,
        message: "TerminalController, sign out - invalid terminalId",
      });
    }

    const terminal = await Terminal.findById(terminalId).lean();

    if (!terminal) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTerminalNotFound,
        message: "TerminalController, sign out, terminal not found",
      });
    }

    const member = await BusinessMember.findOne({
      businessId: terminal.businessId,
      status: "active",
      userId: user._id.toString(),
      role: "owner",
    }).lean();

    if (member) {
      await TerminalOperatorReference.updateMany(
        { terminalId, endTimeStamp: { $exists: false } },
        { $set: { endTimeStamp: Date.now() } },
      );

      return Base.successResponse(response, Const.responsecodeSucceed, {});
    }

    const refs = await TerminalOperatorReference.find({
      terminalId,
      userId: user._id.toString(),
      endTimeStamp: { $exists: false },
    })
      .sort({ startTimeStamp: -1 })
      .limit(1)
      .lean();

    const ref = refs && refs.length > 0 ? refs[0] : null;

    if (!ref || ref.userId !== user._id.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotActiveOnTerminal,
        message:
          "TerminalController, sign out, no active session found for the user on this terminal",
      });
    }

    await TerminalOperatorReference.findByIdAndUpdate(ref._id, {
      $set: { endTimeStamp: Date.now() },
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "TerminalController, sign out",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/businesses/terminals Create terminal flom_v1
 * @apiVersion 2.0.34
 * @apiName Create terminal
 * @apiGroup WebAPI Business
 * @apiDescription Create a new terminal.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}  outletId  Outlet ID to which the terminal will be associated
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "terminal": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "businessId": "6a4bb17dab58c78c74906cd6",
 *             "outletId": "6a4bb17dab58c78c74906cd6",
 *             "chainId": "6a4bb17dab58c78c74906cd6",
 *             "subChainId": "6a4bb17dab58c78c74906cd6",
 *             "paymentAddress": "1234567890",
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
 * }
 *
 * @apiError (Errors) 443981 Invalid outlet id
 * @apiError (Errors) 443982 Outlet not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { outletId } = request.body;

    if (!outletId || !Utils.isValidObjectId(outletId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidOutletId,
        message: "TerminalController, create terminal - invalid outletId",
      });
    }

    const outlet = await Outlet.findById(outletId).lean();

    if (!outlet) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeOutletNotFound,
        message: "TerminalController, create terminal - outlet not found",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      outletId,
      action: "business:profile",
    });

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "TerminalController, create terminal - user is not allowed to create a terminal",
      });
    }

    let paymentAddress = Utils.generateRandomNumber(10);
    let addressExists = false;

    do {
      const existingTerminal = await Terminal.findOne({
        paymentAddress: paymentAddress,
      });
      addressExists = !!existingTerminal;
      if (addressExists) {
        paymentAddress = Utils.generateRandomNumber(10);
      }
    } while (addressExists);

    let terminal = await Terminal.create({
      businessId: outlet.businessId.toString(),
      outletId: outlet._id.toString(),
      chainId: outlet.chainId.toString(),
      subChainId: outlet.subChainId.toString(),
      paymentAddress,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { terminal: terminal.toObject() });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "TerminalController, create terminal",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/terminals/:terminalId Get terminal flom_v1
 * @apiVersion 2.0.34
 * @apiName Get terminal
 * @apiGroup WebAPI Business
 * @apiDescription Get terminal details.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "terminal": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "businessId": "6a4bb17dab58c78c74906cd6",
 *             "outletId": "6a4bb17dab58c78c74906cd6",
 *             "chainId": "6a4bb17dab58c78c74906cd6",
 *             "subChainId": "6a4bb17dab58c78c74906cd6",
 *             "paymentAddress": "1234567890",
 *             "created": 1783345533103,
 *             "operator": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "name": "John Doe",
 *                 "userName": "johndoe",
 *                 "firstName": "John",
 *                 "lastName": "Doe",
 *                 "phoneNumber": "+385958710207",
 *                 "avatar": {},
 *                 "created": 1783345533103
 *             },
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443983 Invalid terminal id
 * @apiError (Errors) 443984 Terminal not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:terminalId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { terminalId } = request.params;

    if (!terminalId || !Utils.isValidObjectId(terminalId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTerminalId,
        message: "TerminalController, get terminal - invalid terminalId",
      });
    }

    const terminal = await Terminal.findById(terminalId).lean();

    if (!terminal) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTerminalNotFound,
        message: "TerminalController, get terminal - terminal not found",
      });
    }

    const members = await BusinessMember.find({ businessId: terminal.businessId }).lean();

    const allowed = members.some(
      (m) => m.userId.toString() === user._id.toString() && m.status === "active",
    );

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "TerminalController, get terminal - user is not allowed to get terminal",
      });
    }

    const terminalOperatorReferences = await TerminalOperatorReference.find({
      terminalId: terminal._id,
      startTimeStamp: { $exists: true },
      endTimeStamp: { $exists: false },
    })
      .sort({ startTimeStamp: -1 })
      .lean();
    const ref =
      terminalOperatorReferences && terminalOperatorReferences.length > 0
        ? terminalOperatorReferences[0]
        : null;

    if (ref) {
      const operator = await User.findById(ref.userId, {
        _id: 1,
        name: 1,
        userName: 1,
        phoneNumber: 1,
        avatar: 1,
        created: 1,
        firstName: 1,
        lastName: 1,
      }).lean();

      if (operator) {
        operator._id = operator._id.toString();
        terminal.operator = operator;
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, { terminal });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "TerminalController, get terminal",
      error,
    });
  }
});

/**
 * @api {delete} /api/v2/businesses/terminals/:terminalId Delete terminal flom_v1
 * @apiVersion 2.0.34
 * @apiName Delete terminal
 * @apiGroup WebAPI Business
 * @apiDescription Delete terminal.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443983 Invalid terminal id
 * @apiError (Errors) 443984 Terminal not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 4000007 Token not valid
 */

router.delete("/:terminalId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { terminalId } = request.params;

    if (!terminalId || !Utils.isValidObjectId(terminalId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTerminalId,
        message: "TerminalController, delete terminal - invalid terminalId",
      });
    }

    const terminal = await Terminal.findById(terminalId).lean();

    if (!terminal) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTerminalNotFound,
        message: "TerminalController, delete terminal - terminal not found",
      });
    }

    const members = await BusinessMember.find({ businessId: terminal.businessId }).lean();

    const allowed = members.some(
      (m) =>
        m.userId.toString() === user._id.toString() && m.status === "active" && m.role === "owner",
    );

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "TerminalController, delete terminal - user is not allowed to delete terminal",
      });
    }

    await Terminal.findByIdAndUpdate(terminalId, { $set: { isDeleted: true } });

    Base.successResponse(response, Const.responsecodeSucceed, { terminal });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "TerminalController, delete terminal",
      error,
    });
  }
});

module.exports = router;
