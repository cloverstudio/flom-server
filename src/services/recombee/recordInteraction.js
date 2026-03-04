const { logger } = require("#infra");
const { client, rqs } = require("./client").getClientAndRequest();

async function recordInteraction({
  user = null,
  product = null,
  liveStream = null,
  type = "view",
  rating = null,
  recommId = null,
}) {
  try {
    if (!user || (!product && !liveStream)) {
      throw new Error("Recombee, recordInteraction, user or product/livestream is missing");
    }

    const userId = user._id.toString();
    const itemId = !liveStream ? "p_" + product._id.toString() : "l_" + liveStream._id.toString();

    let interactionRequest;
    switch (type) {
      case "view":
        interactionRequest = new rqs.AddDetailView(userId, itemId, {
          cascadeCreate: true,
          ...(recommId && { recommId }),
        });
        break;
      case "like":
        interactionRequest = new rqs.AddBookmark(userId, itemId, {
          cascadeCreate: true,
          ...(recommId && { recommId }),
        });
        break;
      case "unlike":
        interactionRequest = new rqs.DeleteBookmark(userId, itemId, {
          cascadeCreate: true,
        });
        break;
      case "rating":
        interactionRequest = new rqs.AddRating(userId, itemId, rating, {
          cascadeCreate: true,
          ...(recommId && { recommId }),
        });
        break;
      case "purchase":
        interactionRequest = new rqs.AddPurchase(userId, itemId, {
          cascadeCreate: true,
          ...(recommId && { recommId }),
        });
        break;
      default:
        throw new Error(`Unknown interaction type: ${type}`);
    }

    return client.send(interactionRequest);
  } catch (error) {
    logger.error("Recombee, recordInteraction error:", error);
    return;
  }
}

module.exports = recordInteraction;
