const { Const } = require("#config");
const { redis } = require("#infra");

async function deleteCallByUserId(userId) {
  const keys = await redis.keys(Const.redisCallQueue + "_" + userId + "_*");

  for (const key of keys) {
    await redis.del(key);
  }
}

module.exports = deleteCallByUserId;
