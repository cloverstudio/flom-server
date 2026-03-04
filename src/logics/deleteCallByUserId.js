const { Const } = require("#config");
const { redis } = require("#infra");

async function deleteCallByUserId(userId) {
  const keys = await redis.keys(Const.redisCallQueue + "_" + userId + "_*");

  await redis.del(keys);
}

module.exports = deleteCallByUserId;
