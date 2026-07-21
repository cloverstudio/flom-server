"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, businessTags, countries } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const Logics = require("#logics");
const { User, Outlet, Terminal, TerminalOperatorReference } = require("#models");

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
 * @apiParam (Request body) {String} userId      ID of the user to be signed in
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
    const { terminalId, userId } = request.body;

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

    if (terminal.isActive) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTerminalAlreadyInUse,
        message: "TerminalController, sign in, terminal is already in use",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      terminalId,
      action: "terminals:signin",
    });

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

    await Terminal.findByIdAndUpdate(terminalId, { $set: { isActive: true } });

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
 * @apiParam (Request body) {String} userId      ID of the user to be signed out
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
    const { terminalId, userId } = request.body;

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

    if (!terminal.isActive) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTerminalNotInUse,
        message: "TerminalController, sign out, terminal is not in use",
      });
    }

    const refs = await TerminalOperatorReference.find({
      terminalId,
      userId,
      endTimeStamp: { $exists: false },
    })
      .sort({ startTimeStamp: -1 })
      .limit(1)
      .lean();

    if (!refs || refs.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotActiveOnTerminal,
        message:
          "TerminalController, sign out, no active session found for the user on this terminal",
      });
    }

    await TerminalOperatorReference.findByIdAndUpdate(refs[0]._id, {
      $set: { endTimeStamp: Date.now() },
    });

    await Terminal.findByIdAndUpdate(terminalId, { $set: { isActive: false } });

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
 *             "isMainTerminal": false,
 *             "isActive": false,
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

module.exports = router;
