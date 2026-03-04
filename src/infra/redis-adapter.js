const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const { Config } = require("#config");

async function redisAdapter(io) {
  const pubClient = createClient({
    socket: {
      host: Config.redis.host,
      port: Config.redis.port,
      reconnectStrategy: false,
    },
    password: Config.redis.password || undefined,
  });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));
}

module.exports = redisAdapter;
