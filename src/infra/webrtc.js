const uuid = require("uuid/v1");
const { Config } = require("#config");
const logger = require("./logger");

function init(io) {
  const config = Config.webRTCConfig;
  const namespace = Config.webRTCConfig.socketNameSpace;

  var nsp = io.of(namespace);

  nsp.on("connection", function (client) {
    logger.notice("Signaling connection...");

    client.resources = {
      screen: false,
      video: true,
      audio: false,
    };

    // pass a message to another id
    client.on("message", function (details, cb) {
      logger.info("Signaling message...");

      if (!details) return;

      const otherClient = nsp.to(details.to);
      if (!otherClient) return;

      details.from = client.id;
      if (details.type == "offer") {
        safeCb(cb)("offerreceived", "");
      }

      otherClient.emit("message", details);
    });

    client.on("shareScreen", function () {
      client.resources.screen = true;
    });

    client.on("unshareScreen", function (type) {
      client.resources.screen = false;
      removeFeed("screen");
    });

    client.on("join", join);

    function removeFeed(type) {
      if (client.room) {
        io.of(namespace).in(client.room).emit("remove", {
          id: client.id,
          type: type,
        });
        if (!type) {
          client.leave(client.room);
          client.room = undefined;
        }
      }
    }

    function join(name, cb) {
      // sanity check
      if (typeof name !== "string") return;

      // check if maximum number of clients reached
      if (
        config.rooms &&
        config.rooms.maxClients > 0 &&
        clientsInRoom(name) >= config.rooms.maxClients
      ) {
        safeCb(cb)("full");
        return;
      }

      // leave any existing rooms
      removeFeed();
      safeCb(cb)(null, describeRoom(name));

      client.emit("signaling joined", describeRoom(name));
      client.join(name);
      client.room = name;
    }

    // we don't want to pass "leave" directly because the
    // event type string of "socket end" gets passed too.
    client.on("disconnect", function () {
      removeFeed();
    });
    client.on("leave", function () {
      removeFeed();
    });

    client.on("create", function (name, cb) {
      if (arguments.length == 2) {
        cb = typeof cb == "function" ? cb : function () {};
        name = name || uuid();
      } else {
        cb = name;
        name = uuid();
      }
      // check if exists

      const room = io.of("/").adapter.rooms.get(name);
      if (room && room.length) {
        safeCb(cb)("taken");
      } else {
        join(name);
        safeCb(cb)(null, name);
      }
    });

    // support for logging full webrtc traces to stdout
    // useful for large-scale error monitoring
    client.on("trace", function (data) {
      [data.type, data.session, data.prefix, data.peer, data.time, data.value];
      //console.log('trace', JSON.stringify(
      //    [data.type, data.session, data.prefix, data.peer, data.time, data.value]
      //));
    });

    // tell client about stun and turn servers and generate nonces
    client.emit("stunservers", config.stunservers || []);

    // create shared secret nonces for TURN authentication
    // the process is described in draft-uberti-behave-turn-rest
    const credentials = [];
    // allow selectively vending turn credentials based on origin.
    const origin = client.handshake.headers.origin;
    if (!config.turnorigins || config.turnorigins.indexOf(origin) !== -1) {
      credentials.push({
        username: config.turnservers[0].user,
        credential: config.turnservers[0].password,
        urls: config.turnservers[0].urls,
      });

      client.emit("turnservers", credentials);
    }
  });

  function describeRoom(name) {
    const adapter = io.of("/" + namespace).adapter;
    let clients = {};

    if (adapter.rooms.get(name)) clients = adapter.rooms.get(name);

    const result = {
      clients: {},
    };

    if (clients.forEach)
      clients.forEach(function (id) {
        result.clients[id] = adapter.nsp.sockets.get(id).resources;
      });

    return result;
  }

  function clientsInRoom(name) {
    const adapter = io.of("/" + namespace).adapter;

    return adapter.rooms[name].length;
  }
}

function safeCb(cb) {
  if (typeof cb === "function") {
    return cb;
  } else {
    return function () {};
  }
}

module.exports = { init };
