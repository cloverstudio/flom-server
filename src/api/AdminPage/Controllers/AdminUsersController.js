"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { AdminPageUser } = require("#models");
const { sendVerificationEmail } = require("../helpers/sendEmail");
const { validateAndGetUser, validateAndUpdateUserData } = require("../helpers/validateData");

/**
 * @api {get} /api/v2/admin-page/users Admin page user list
 * @apiVersion 2.0.9
 * @apiName Admin page user list
 * @apiGroup WebAPI Admin page - Users
 * @apiDescription API used for getting the list of admin users. API will always return users who have lower role than the request user.
 * Content manager role needed for access. Only super admins can see users that are not verified.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) [username] Users username
 * @apiParam (Query string) [role] Users role
 * @apiParam (Query string) [page] Page number. Default 1
 * @apiParam (Query string) [itemsPerPage] Number of results per page. Default 10
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1632402033832,
 *   "data": {
 *     "users": [
 *       {
 *         "id": "614b257f3a6c01426282d58f",
 *         "username": "testChangeEmail223",
 *         "role": 100,
 *         "email": "kemauri.jeovanny@ecodaw.com",
 *         "phoneNumber": "+385999999999"
 *       },
 *       {
 *         "id": "614b25123a6c01426282d58e",
 *         "username": "testChangeEmail21",
 *         "role": 100,
 *         "email": "kemauri.jeovanny@ecodaw.com",
 *         "phoneNumber": "+385999999999"
 *       },
 *     ],
 *     "pagination": {
 *       "total": 2,
 *       "itemsPerPage": 10
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
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.get(
  "/",
  auth({ allowAdmin: true, role: Const.Role.CONTENT_MANAGER }),
  async (request, response) => {
    try {
      const { role: requestUserRole } = request.user;
      const { username, role } = request.query;
      const page = +request.query.page || 1;
      const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

      const searchQuery = {};

      if (role >= requestUserRole) {
        return Base.successResponse(response, Const.responsecodeSucceed, {
          users: [],
          pagination: { total: 0, itemsPerPage },
        });
      }

      if (username) {
        searchQuery.username = username;
      }
      if (role && !isNaN(+role)) {
        searchQuery.role = role;
      } else {
        if (requestUserRole === Const.Role.SUPER_ADMIN) {
          searchQuery.role = { $lt: requestUserRole };
        } else {
          searchQuery.role = { $lt: requestUserRole, $ne: Const.Role.INITIAL };
        }
      }

      const users = await AdminPageUser.find(searchQuery, {
        username: 1,
        email: 1,
        phoneNumber: 1,
        role: 1,
      })
        .limit(itemsPerPage)
        .skip((page - 1) * itemsPerPage)
        .sort({ created: -1 })
        .lean();

      const usersFormatted = users.map((user) => {
        const { _id: id, __v, ...rest } = user;
        return { id, ...rest };
      });

      const total = await AdminPageUser.countDocuments(searchQuery);

      Base.successResponse(response, Const.responsecodeSucceed, {
        users: usersFormatted,
        pagination: { total, itemsPerPage },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminUserController - user list",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/admin-page/users Admin page update your profile
 * @apiVersion 2.0.9
 * @apiName Admin page update your profile
 * @apiGroup WebAPI Admin page - Users
 * @apiDescription API used for updating users own data. Use form-data in request body.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} [username] Users username
 * @apiParam {String} [password] Users password
 * @apiParam {String} [email] Users email
 * @apiParam {String} [firstName] Users first name
 * @apiParam {String} [lastName] Users last name
 * @apiParam {String} [phoneNumber] Users phone number
 * @apiParam {String} [bvn] Users bvn
 * @apiParam {String} [address] Users address
 * @apiParam {String} [socialMedia] JSON stringified array of objects e.g. "[{"type":1,"username":"md"},{"type":2,"username":"instar"}]"
 *
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1632474824460,
 *   "data": {
 *     "user": {
 *       "id": "614c801c8368a466ae4d9ba3",
 *       "emailVerification": {
 *         "verified": true,
 *         "code": "172673",
 *         "token": "*****",
 *         "emailOut": "1632403484745"
 *       },
 *       "socialMedia": [],
 *       "created": 1632403484745,
 *       "username": "markoClover12",
 *       "role": 100,
 *       "bvn": "bvn",
 *       "email": "marko.r+2@clover.studio",
 *       "firstName": "Marko",
 *       "lastName": "clover",
 *       "phoneNumber": "+385999999999",
 *       "address": "testClover"
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
 * @apiError (Errors) 443001 Username taken
 * @apiError (Errors) 443212 Username contains forbidden characters (No spaces and only these special characters are allowed - _ ~ )
 * @apiError (Errors) 443218 UserId is not a valid id
 * @apiError (Errors) 4000110 No userId
 * @apiError (Errors) 4000760 User with userId not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/",
  auth({ allowAdmin: true, role: Const.Role.EMAIL_VERIFIED }),
  async (request, response) => {
    try {
      const { user } = request;
      const { fields = {} } = await Utils.formParse(request);
      const { username, password, email, firstName, lastName, phoneNumber, bvn, address } = fields;
      const socialMedia = fields.socialMedia ? JSON.parse(fields.socialMedia) : [];

      const validateAndUpdateUser = await validateAndUpdateUserData({
        user,
        username,
        password,
        email,
        firstName,
        lastName,
        phoneNumber,
        bvn,
        address,
        socialMedia,
        sendVerificationEmail,
      });
      if (validateAndUpdateUser.code) {
        return Base.newErrorResponse({
          response,
          code: validateAndUpdateUser.code,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - update user, ${validateAndUpdateUser.message}`,
        });
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        user: validateAndUpdateUser.user,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminUserController - update user",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/admin-page/users/:userId/management Admin page user management
 * @apiVersion 2.0.9
 * @apiName Admin page user management
 * @apiGroup WebAPI Admin page - Users
 * @apiDescription API used for managing users. Content manager role needed for access. You can only manage users with role lower than yours.
 * Use form-data in request body.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} [username] Users username
 * @apiParam {String} [email] Users email
 * @apiParam {String} [firstName] Users first name
 * @apiParam {String} [lastName] Users last name
 * @apiParam {String} [phoneNumber] Users phone number
 * @apiParam {String} [bvn] Users bvn
 * @apiParam {String} [address] Users address
 * @apiParam {String} [socialMedia] JSON stringified array of objects e.g. "[{"type":1,"username":"md"},{"type":2,"username":"instar"}]"
 * @apiParam {String} [role] Users role
 *
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1632474824460,
 *   "data": {
 *     "user": {
 *       "id": "614c801c8368a466ae4d9ba3",
 *       "emailVerification": {
 *         "verified": true,
 *         "code": "172673",
 *         "token": "*****",
 *         "emailOut": "1632403484745"
 *       },
 *       "socialMedia": [],
 *       "created": 1632403484745,
 *       "username": "markoClover12",
 *       "role": 100,
 *       "bvn": "bvn",
 *       "email": "marko.r+2@clover.studio",
 *       "firstName": "Marko",
 *       "lastName": "clover",
 *       "phoneNumber": "+385999999999",
 *       "address": "testClover"
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
 * @apiError (Errors) 443001 Username taken
 * @apiError (Errors) 443212 Username contains forbidden characters (No spaces and only these special characters are allowed - _ ~ )
 * @apiError (Errors) 443218 UserId is not a valid id
 * @apiError (Errors) 4000110 No userId
 * @apiError (Errors) 4000760 User with userId not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/:userId/management",
  auth({ allowAdmin: true, role: Const.Role.CONTENT_MANAGER }),
  async (request, response) => {
    try {
      const { userId } = request.params;
      const { role: requestUserRole } = request.user;
      const { fields = {} } = await Utils.formParse(request);
      const { username, email, firstName, lastName, phoneNumber, bvn, address, role } = fields;
      const socialMedia = fields.socialMedia ? JSON.parse(fields.socialMedia) : [];

      const { code, message, user } = await validateAndGetUser(userId);
      if (code) {
        return Base.newErrorResponse({
          response,
          code,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - user management, ${message}`,
        });
      }

      if (requestUserRole <= user.role) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUnauthorized,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - user details, unauthorized`,
        });
      }

      const validateAndUpdateUser = await validateAndUpdateUserData({
        user,
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        bvn,
        address,
        socialMedia,
        role,
        requestUserRole,
        sendVerificationEmail,
      });
      if (validateAndUpdateUser.code) {
        return Base.newErrorResponse({
          response,
          code: validateAndUpdateUser.code,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - user management, ${validateAndUpdateUser.message}`,
        });
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        user: validateAndUpdateUser.user,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminUserController - user management",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/users/:userId Admin page get user details
 * @apiVersion 2.0.9
 * @apiName Admin page get user details
 * @apiGroup WebAPI Admin page - Users
 * @apiDescription API used for getting user data. Content manager role needed for access. You can only get user details from
 * users with role lower than yours or your own user details.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1632474824460,
 *   "data": {
 *     "user": {
 *       "id": "614c801c8368a466ae4d9ba3",
 *       "emailVerification": {
 *         "verified": true,
 *         "code": "172673",
 *         "token": "*****",
 *         "emailOut": "1632403484745"
 *       },
 *       "socialMedia": [],
 *       "created": 1632403484745,
 *       "username": "markoClover12",
 *       "role": 100,
 *       "bvn": "bvn",
 *       "email": "marko.r+2@clover.studio",
 *       "firstName": "Marko",
 *       "lastName": "clover",
 *       "phoneNumber": "+385999999999",
 *       "address": "testClover"
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
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.get(
  "/:userId",
  auth({ allowAdmin: true, role: Const.Role.CONTENT_MANAGER }),
  async (request, response) => {
    try {
      const { userId } = request.params;
      const { role: requestUserRole } = request.user;
      const requestUserId = request.user._id.toString();

      const { code, message, user } = await validateAndGetUser(userId);
      if (code) {
        return Base.newErrorResponse({
          response,
          code,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - user details, ${message}`,
        });
      }

      if (requestUserId !== userId && requestUserRole <= user.role) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUnauthorized,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - user details, unauthorized`,
        });
      }

      const { _id: id, password, token, __v, ...rest } = user.toObject();

      Base.successResponse(response, Const.responsecodeSucceed, {
        user: { id, ...rest },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminUserController - user details",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/users/:userId Admin page delete user
 * @apiVersion 2.0.9
 * @apiName Admin page delete user
 * @apiGroup WebAPI Admin page - Users
 * @apiDescription API used for deleting user data. Content manager role needed for access. You can only delete user from
 * if his role is lower than yours.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1632474824460,
 *   "data": {
 *     "deleted": true,
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

router.delete(
  "/:userId",
  auth({ allowAdmin: true, role: Const.Role.CONTENT_MANAGER }),
  async (request, response) => {
    try {
      const { userId } = request.params;
      const { role: requestUserRole } = request.user;

      const { code, message, user } = await validateAndGetUser(userId);
      if (code) {
        return Base.newErrorResponse({
          response,
          code,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - delete user, ${message}`,
        });
      }

      if (requestUserRole <= user.role) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUnauthorized,
          type: Const.logTypeAdminPage,
          message: `AdminUserController - delete user, unauthorized`,
        });
      }

      await AdminPageUser.deleteOne({ _id: user._id });

      Base.successResponse(response, Const.responsecodeSucceed, {
        deleted: true,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminUserController - delete user",
        error,
      });
    }
  },
);

module.exports = router;
