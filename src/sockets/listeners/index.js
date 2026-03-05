const { Socket } = require("socket.io");
const { logger } = require("#infra");

const listeners = {
  auctions: {
    AuctionsActionsHandler: require("./AuctionsActionsHandler"),
  },
  flom: {
    Login: require("./Login"),
    CallingActionsHandler: require("./CallingActionsHandler"),
    DeleteMessageActionHandler: require("./DeleteMessageActionHandler"),
    DeliverMessageActionHandler: require("./DeliverMessageActionHandler"),
    DisconnectActionHandler: require("./DisconnectActionHandler"),
    FlomTeamActionsHandler: require("./FlomTeamActionsHandler"),
    KeepAliveActionHandler: require("./KeepAliveActionHandler"),
    MessageReactionHandler: require("./MessageReactionHandler"),
    OnlineStatusActionHandler: require("./OnlineStatusActionHandler"),
    OpenMessageActionHandler: require("./OpenMessageActionHandler"),
    PongActionHandler: require("./PongActionHandler"),
    SendMessageActionHandler: require("./SendMessageActionHandler"),
    SendTypingActionHandler: require("./SendTypingActionHandler"),
    UpdateAttributesActionHandler: require("./UpdateAttributesActionHandler"),
    UpdateMessageActionHandler: require("./UpdateMessageActionHandler"),
  },
};

/**
 * @param {Socket} socket
 * @param {string} [namespace= "flom"]
 */
function attachListeners(socket, namespace = "flom") {
  const namespaceListeners = listeners[namespace];
  if (!namespaceListeners) {
    logger.warn("attachListeners: no listeners found for namespace " + namespace);
    return;
  }

  Object.keys(namespaceListeners).forEach((listenerName) => {
    const listener = namespaceListeners[listenerName];
    if (typeof listener === "function") {
      listener(socket);
    } else {
      logger.warn("attachListeners: listener " + listenerName + " is not a function");
    }
  });
}

module.exports = attachListeners;
