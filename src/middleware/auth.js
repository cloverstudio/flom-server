const { Config, Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { User, AdminPageUser } = require("#models");

function checkTokenAndRole({
  allowUser = false,
  allowAdmin = false,
  role,
  includedRoles,
  excludedRoles,
}) {
  return async (request, response, next) => {
    const token = request.headers["access-token"] || request.cookies["access-token"];
    let isAdmin = false;

    const userId = request.headers["userid"];
    const adminId = request.headers["adminid"];
    const testSnippet = request.headers["test-snippet"];

    if (testSnippet === Config.testSnippet && !token && (userId || adminId)) {
      if (userId) {
        request.user = await User.findById(userId).lean();
      } else if (adminId) {
        request.user = await AdminPageUser.findById(adminId).lean();
      }

      if (!request.user) {
        return sendInvalidTokenResponse(response, request);
      }

      return next();
    }

    if (!token || (Array.isArray(token) && token.length === 0)) {
      return sendInvalidTokenResponse(response, request);
    }

    let user, diff, tokenObj;
    switch (token.length) {
      case Const.tokenLength:
        if (!allowUser) {
          return sendUnauthorizedResponse(response, request);
        }
        user = await User.findOne({
          "token.token": token,
        }).lean();

        if (!user || user?.isDeleted?.value === true) {
          return sendInvalidTokenResponse(response, request);
        }

        tokenObj = user.token.find((tokenObjInAry) => tokenObjInAry.token == token);

        diff = Date.now() - tokenObj.generateAt;
        if (diff > Const.tokenValidInterval) {
          return sendInvalidTokenResponse(response, request);
        }
        break;
      case Const.adminPageTokenLength:
        if (!allowAdmin) {
          return sendUnauthorizedResponse(response, request);
        }
        user = await AdminPageUser.findOne({
          "token.token": token,
        }).lean();

        if (!user) {
          return sendInvalidTokenResponse(response, request);
        }

        diff = Date.now() - user.token.generatedAt;
        if (diff > Const.adminPageTokenValidInterval) {
          return sendInvalidTokenResponse(response, request);
        }

        const requestUserRole = user.role;
        if (excludedRoles?.length && excludedRoles.indexOf(requestUserRole) !== -1) {
          return sendUnauthorizedResponse(response, request);
        }
        if (includedRoles?.length) {
          if (includedRoles.indexOf(requestUserRole) !== -1) {
            request.user = user;
            return next();
          } else {
            return sendUnauthorizedResponse(response, request);
          }
        }
        if (user.role < role) {
          return sendUnauthorizedResponse(response, request);
        }

        isAdmin = true;
        break;
      default:
        return sendInvalidTokenResponse(response, request);
    }

    request.user = user;
    request.isAdmin = isAdmin;

    next();
  };
}

function sendInvalidTokenResponse(response, request) {
  logger.warn("Error code: 4000007, Invalid token");

  Utils.clearCookies(response, request.headers.origin);

  // response.clearCookie("access-token", Config.cookieConfig);
  // response.clearCookie("userId", Config.cookieConfig);

  return response.json({
    code: Const.responsecodeSigninInvalidToken,
    time: Date.now(),
  });
}

function sendUnauthorizedResponse(response, request) {
  Utils.clearCookies(response, request.headers.origin);

  // response.clearCookie("access-token", Config.cookieConfig);
  // response.clearCookie("userId", Config.cookieConfig);

  logger.warn("Error code: 5000001, Unauthorized");
  return response.json({
    code: Const.responsecodeUnauthorized,
    time: Date.now(),
  });
}

module.exports = checkTokenAndRole;
