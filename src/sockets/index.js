const { Server } = require("socket.io");
const { redisAdapter, logger } = require("#infra");
const socketApi = require("./socket-api");

async function init(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
    pingInterval: 5000,
    transports: ["websocket"],
  });

  await redisAdapter(io);

  socketApi.init(io);

  io.use((socket, next) => {
    logger.debug("Socket IO middleware executed for socket: ", socket.id);
    logger.debug("Socket IO middleware handshake: ", JSON.stringify(socket.handshake, null, 2));
    socket.data.middlewareTest = "middlewareTest for socket " + socket.id;

    next();
  });

  io.on("connection", (socket) => {
    socket.setTimeout(600000);
    logger.debug("Socket IO connected: ", socket.id);

    socket.test = "test";
    if (socket.data) socket.data.dataTest = "dataTest";
  });

  return io;
}

module.exports = { init, socketApi };
