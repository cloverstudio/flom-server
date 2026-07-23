"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const Models = require("#models");
const { auth } = require("#middleware");

/**
 * @api {get} /api/v2/admin-page/landing-page/shells/:countryCode Admin page - Get landing page shell by country code
 * @apiVersion 2.0.10
 * @apiName Admin page get landing page shell list
 * @apiGroup WebAPI Admin page - Landing page
 * @apiDescription API used for retrieving landing page shell list for flom_v1. Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (URL parameter) {String}  countryCode  Country code (e.g. "US", "default" for default shell)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639566785977,
 *   "data": {
 *     "landingPageShell": {
 *       "_id": "61b9cdc1700dde7eaf79a57e",
 *       "countryCode": "US",
 *       "entityName": "Test Entity",
 *       "termsOfService": "Bla bla bla",
 *       "privacyPolicy": "Bla bla bla 2",
 *       "created": 1639566785977
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
 * @apiError (Errors) 443691 Invalid country code
 * @apiError (Errors) 444005 Landing page shell not found
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.get(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { countryCode } = request.params;

      if (!countryCode || (!countries[countryCode] && countryCode !== "default")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message:
            "AdminLandingPageController - get landing page shell by country code, invalid country code",
        });
      }

      const shell = await Models.LandingPageShell.findOne({ countryCode }).lean();

      if (!shell) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeLandingPageShellNotFound,
          message: `AdminLandingPageController - get landing page shell by country code, landing page shell for country code ${countryCode} not found`,
        });
      }

      return Base.successResponse(response, Const.responsecodeSucceed, { landingPageShell: shell });
    } catch (error) {
      return Base.newErrorResponse({
        response,
        message: "AdminLandingPageController - get landing page shell by country code",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/landing-page/shells Admin page - Get landing page shell list
 * @apiVersion 2.0.10
 * @apiName Admin page get landing page shell list
 * @apiGroup WebAPI Admin page - Landing page
 * @apiDescription API used for retrieving landing page shell list for flom_v1. Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639566785977,
 *   "data": {
 *     "landingPageShells": [
 *       {
 *         "_id": "61b9cdc1700dde7eaf79a57e",
 *         "countryCode": "US",
 *         "entityName": "Test Entity",
 *         "termsOfService": "Bla bla bla",
 *         "privacyPolicy": "Bla bla bla 2",
 *         "created": 1639566785977
 *       }
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const shells = await Models.LandingPageShell.find({}).lean();

    return Base.successResponse(response, Const.responsecodeSucceed, { landingPageShells: shells });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      message: "AdminLandingPageController - get landing page shell list",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/admin-page/landing-page/shells/:countryCode Admin page - Create landing page shell
 * @apiVersion 2.0.10
 * @apiName Admin page create landing page shell
 * @apiGroup WebAPI Admin page - Landing page
 * @apiDescription API used for creating new landing page shell for flom_v1. Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (URL parameter) {String}  countryCode  Country code (e.g. "US", "default" for default shell)
 *
 * @apiParam (Request body) {String}  entityName		  Entity name
 * @apiParam (Request body) {String}  termsOfService  Terms of service text
 * @apiParam (Request body) {String}  privacyPolicy	  Privacy policy text
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639566785977,
 *   "data": {
 *     "landingPageShell": {
 *       "_id": "61b9cdc1700dde7eaf79a57e",
 *       "countryCode": "US",
 *       "entityName": "Test Entity",
 *       "termsOfService": "Bla bla bla",
 *       "privacyPolicy": "Bla bla bla 2",
 *       "created": 1639566785977
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
 * @apiError (Errors) 443691 Invalid country code
 * @apiError (Errors) 444006 Landing page shell already exists
 * @apiError (Errors) 444002 Invalid entity name parameter
 * @apiError (Errors) 444003 Invalid terms of service parameter
 * @apiError (Errors) 444004 Invalid privacy policy parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.post(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { countryCode } = request.params;
      const { entityName, termsOfService, privacyPolicy } = request.body;

      if (!countryCode || (!countries[countryCode] && countryCode !== "default")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: "AdminLandingPageController - create landing page shell, invalid country code",
        });
      }

      const exists = await Models.LandingPageShell.findOne({ countryCode }).lean();
      if (exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeLandingPageShellExists,
          message: `AdminLandingPageController - create landing page shell, landing page shell for country code ${countryCode} already exists`,
        });
      }

      if (!entityName || typeof entityName !== "string" || entityName.trim().length === 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidEntityName,
          message: `AdminLandingPageController - create landing page shell, invalid entity name parameter`,
        });
      }

      if (
        !termsOfService ||
        typeof termsOfService !== "string" ||
        termsOfService.trim().length === 0
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTermsOfService,
          message: `AdminLandingPageController - create landing page shell, invalid terms of service parameter`,
        });
      }

      if (
        !privacyPolicy ||
        typeof privacyPolicy !== "string" ||
        privacyPolicy.trim().length === 0
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidPrivacyPolicy,
          message: `AdminLandingPageController - create landing page shell, invalid privacy policy parameter`,
        });
      }

      const shell = await Models.LandingPageShell.create({
        countryCode,
        entityName,
        termsOfService,
        privacyPolicy,
      });

      return Base.successResponse(response, Const.responsecodeSucceed, {
        landingPageShell: shell.toObject(),
      });
    } catch (error) {
      return Base.newErrorResponse({
        response,
        message: "AdminLandingPageController - create landing page shell",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/admin-page/landing-page/shells/:countryCode Admin page - Update landing page shell
 * @apiVersion 2.0.10
 * @apiName Admin page update landing page shell
 * @apiGroup WebAPI Admin page - Landing page
 * @apiDescription API used for updating landing page shell for flom_v1. Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (URL parameter) {String}  countryCode  Country code (e.g. "US", "default" for default shell)
 *
 * @apiParam (Request body) {String} 	[entityName]		  Entity name
 * @apiParam (Request body) {String} 	[termsOfService]  Terms of service text
 * @apiParam (Request body) {String} 	[privacyPolicy]	  Privacy policy text
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639566785977,
 *   "data": {
 *     "landingPageShell": {
 *       "_id": "61b9cdc1700dde7eaf79a57e",
 *       "countryCode": "US",
 *       "entityName": "Test Entity",
 *       "termsOfService": "Bla bla bla",
 *       "privacyPolicy": "Bla bla bla 2",
 *       "created": 1639566785977
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
 * @apiError (Errors) 443691 Invalid country code
 * @apiError (Errors) 444005 Landing page shell not found
 * @apiError (Errors) 444002 Invalid entity name parameter
 * @apiError (Errors) 444003 Invalid terms of service parameter
 * @apiError (Errors) 444004 Invalid privacy policy parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.patch(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { countryCode } = request.params;
      const { entityName, termsOfService, privacyPolicy } = request.body;

      const updateData = {};

      if (!countryCode || (!countries[countryCode] && countryCode !== "default")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: "AdminLandingPageController - update landing page shell, invalid country code",
        });
      }

      if (entityName) {
        if (typeof entityName !== "string" || entityName.trim().length === 0) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidEntityName,
            message: `AdminLandingPageController - update landing page shell, invalid entity name parameter`,
          });
        }
        updateData.entityName = entityName;
      }

      if (termsOfService) {
        if (typeof termsOfService !== "string" || termsOfService.trim().length === 0) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTermsOfService,
            message: `AdminLandingPageController - update landing page shell, invalid terms of service parameter`,
          });
        }
        updateData.termsOfService = termsOfService;
      }

      if (privacyPolicy) {
        if (typeof privacyPolicy !== "string" || privacyPolicy.trim().length === 0) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidPrivacyPolicy,
            message: `AdminLandingPageController - update landing page shell, invalid privacy policy parameter`,
          });
        }
        updateData.privacyPolicy = privacyPolicy;
      }

      const shell = await Models.LandingPageShell.findOneAndUpdate(
        { countryCode },
        { ...updateData },
        { new: true, lean: true },
      );

      if (!shell) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeLandingPageShellNotFound,
          message: `AdminLandingPageController - update landing page shell, landing page shell for country code ${countryCode} not found`,
        });
      }

      return Base.successResponse(response, Const.responsecodeSucceed, { landingPageShell: shell });
    } catch (error) {
      return Base.newErrorResponse({
        response,
        message: "AdminLandingPageController - update landing page shell",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/landing-page/shells/:countryCode Admin page - Delete landing page shell by country code
 * @apiVersion 2.0.10
 * @apiName Admin page delete landing page shell
 * @apiGroup WebAPI Admin page - Landing page
 * @apiDescription API used for deleting landing page shell for flom_v1. Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (URL parameter) {String}  countryCode  Country code (e.g. "US", "default" for default shell)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639566785977,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443691 Invalid country code
 * @apiError (Errors) 444005 Landing page shell not found
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.delete(
  "/:countryCode",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { countryCode } = request.params;

      if (!countryCode || (!countries[countryCode] && countryCode !== "default")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: "AdminLandingPageController - delete landing page shell, invalid country code",
        });
      }

      const res = await Models.LandingPageShell.deleteOne({ countryCode });
      if (res.deletedCount === 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeLandingPageShellNotFound,
          message: `AdminLandingPageController - delete landing page shell, landing page shell for country code ${countryCode} not found`,
        });
      }

      return Base.successResponse(response, Const.responsecodeSucceed, {});
    } catch (error) {
      return Base.newErrorResponse({
        response,
        message: "AdminLandingPageController - delete landing page shell",
        error,
      });
    }
  },
);

module.exports = router;
