const { redis, logger } = require("#infra");
const { Const } = require("#config");
const { User } = require("#models");

module.exports = {
  checkToken: async function (token) {
    if (!token) {
      logger.error("Socket utils, checkToken, token missing");
      return null;
    }

    const user = await User.findOne({ "token.token": token }).lean();

    if (!user) {
      logger.error("Socket utils, checkToken, user not found");
      return null;
    }

    const tokenObj = user.token.find((tokenObjInAry) => tokenObjInAry.token == token);
    const tokenGenerated = tokenObj.generateAt;
    const diff = Date.now() - tokenGenerated;

    if (diff > Const.tokenValidInterval) {
      logger.error("Socket utils, checkToken, token interval exceeded");
      return null;
    }

    return user;
  },
};
