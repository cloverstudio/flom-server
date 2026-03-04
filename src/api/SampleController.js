"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Config, Const, countries } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const {} = require("#models");

/**
 * @api {method} /api/v2/sample/:urlParamArg Sample API flom_v1
 * @apiVersion 2.0.16
 * @apiName  Sample API flom_v1
 * @apiGroup WebAPI Sample API
 * @apiDescription  Sample API.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * // Query string args:
 * @apiParam (Query string) {String} [artist]  Sample
 * @apiParam (Query string) {String} [title]   Sample
 * // Request Body args:
 * @apiParam {String}                sample    Sample
 * @apiParam {Number}                [sample]  Sample
 * @apiParam {File}                  sample    Sample
 *
 * @apiSuccessExample {json} Success Response
 * {
 *      // add postman response here
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 000000 Sample error
 * @apiError (Errors) 4000007 Token invalid
 */

// basic method router, replace METHOD with get, post, put, patch, delete
// please always use newErrorResponse for errors
// if you must use successResponse for errors then add a log explaining the error:
//            logger.error("SampleController, METHOD, sample error message");

router.method(
  "/",
  auth({
    allowUser: true,
    allowAdmin: true,
    role: Const.Role.ADMIN,
    includedRoles: [],
    excludedRoles: [],
  }),
  async function (request, response) {
    try {
      const failure = true;
      if (failure) {
        return Base.newErrorResponse({
          response,
          code: Const.SAMPLE_ERROR_CODE,
          message: "SampleController, METHOD - failure",
        });
      }

      const responseData = {};
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SampleController, METHOD",
        error,
      });
    }
  },
);

module.exports = router;
