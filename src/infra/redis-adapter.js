const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const logger = require("./logger");
const { Config } = require("#config");

async function redisAdapter(io) {
  const pubClient = createClient({
    socket: {
      host: Config.redis.host,
      port: Config.redis.port,
      reconnectStrategy: (retries) => {
        logger.warn(`Redis Adapter reconnect attempt #${retries}`);
        if (retries > 10) return new Error("Too many retries");
        return Math.min(retries * 100, 3000); // backoff
      },
    },
    password: Config.redis.password || undefined,
  });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => logger.error("Redis pubClient error", error));
  pubClient.on("connect", () => logger.notice("Redis pubClient connecting..."));
  pubClient.on("ready", () => logger.notice("Redis pubClient ready"));
  pubClient.on("reconnecting", () => logger.notice("Redis pubClient reconnecting"));
  pubClient.on("end", () => logger.error("Redis pubClient connection closed"));
  const originalPubQuit = pubClient.quit.bind(pubClient);
  pubClient.quit = () => {
    logger.error("Redis pubClient, quit called!");
  };

  subClient.on("error", (error) => logger.error("Redis subClient error", error));
  subClient.on("connect", () => logger.notice("Redis subClient connecting..."));
  subClient.on("ready", () => logger.notice("Redis subClient ready"));
  subClient.on("reconnecting", () => logger.notice("Redis subClient reconnecting"));
  subClient.on("end", () => logger.error("Redis subClient connection closed"));
  const originalSubQuit = subClient.quit.bind(subClient);
  subClient.quit = () => {
    logger.error("Redis subClient, quit called!");
  };

  try {
    await pubClient.connect();
  } catch (error) {
    logger.error("Failed to connect pubClient", error);
  }
  try {
    await subClient.connect();
  } catch (error) {
    logger.error("Failed to connect subClient", error);
  }

  io.adapter(createAdapter(pubClient, subClient));
}

module.exports = redisAdapter;
