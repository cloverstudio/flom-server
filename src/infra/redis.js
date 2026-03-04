const redis = require("redis");
const logger = require("./logger");
const { Config } = require("#config");

/**
 * @type {redis.RedisClientType}
 */
let client = null;

async function init() {
  client = redis.createClient({
    socket: {
      host: Config.redis.host,
      port: Config.redis.port,
      reconnectStrategy: false,
    },
    password: Config.redis.password || undefined,
  });

  // Handle events
  client.on("error", (error) => logger.error("Redis client error", error));
  client.on("connect", () => logger.notice("Redis client connecting..."));
  client.on("ready", () => logger.notice("Redis client ready"));
  client.on("reconnecting", () => logger.warn("Redis client reconnecting"));
  client.on("end", () => logger.warn("Redis connection closed"));

  try {
    await client.connect();
  } catch (error) {
    logger.error("Failed to connect to Redis", error);
  }
}

async function keys(pattern = "*") {
  try {
    if (!pattern) throw new Error("no pattern");

    let cursor = "0";
    const keys = [];

    do {
      const reply = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = reply.cursor;
      keys.push(...reply.keys);
    } while (cursor !== "0");

    return keys;
  } catch (error) {
    logger.error("Redis KEYS", error);
    return [];
  }
}

async function get(key = null) {
  try {
    if (!key) throw new Error("no key");

    const value = await client.get(key);
    return typeof value === "number" ? value : JSON.parse(value);
  } catch (error) {
    logger.error("Redis GET", error);
    return null;
  }
}

async function set(key = null, value = null, expirationInSeconds = null) {
  try {
    if (!key) throw new Error("no key");
    if (!value) throw new Error("no value");

    value = typeof value === "number" ? value : JSON.stringify(value);

    if (!expirationInSeconds) {
      await client.set(key, value);
    } else {
      await client.set(key, value, "EX", expirationInSeconds);
    }
  } catch (error) {
    logger.error("Redis SET", error);
    return null;
  }
}

async function del(key = null) {
  try {
    if (!key) throw new Error("no key");
    await client.del(key);
  } catch (error) {
    logger.error("Redis DEL", error);
    return null;
  }
}

async function incr(key = null) {
  try {
    if (!key) throw new Error("no key");
    await client.incr(key);
  } catch (error) {
    logger.error("Redis INCR", error);
    return null;
  }
}

async function decr(key = null) {
  try {
    if (!key) throw new Error("no key");
    await client.decr(key);
  } catch (error) {
    logger.error("Redis DECR", error);
    return null;
  }
}

module.exports = {
  init,
  keys,
  get,
  set,
  del,
  incr,
  decr,
};
