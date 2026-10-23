module.exports = Object.freeze({
  upsertUser: require("./upsertUser"),
  deactivateLiveStreams: require("./deactivateLiveStreams"),
  deleteAllItems: require("./deleteAllItems"),
  deleteAllUsers: require("./deleteAllUsers"),
  getNextRecommendations: require("./getNextRecommendations"),
  getRecommendations: require("./getRecommendations"),
  recordInteraction: require("./recordInteraction"),
  syncLiveStreams: require("./syncLiveStreams"),
  syncProducts: require("./syncProducts"),
  syncPurchases: require("./syncPurchases"),
  syncUsers: require("./syncUsers"),
  upsertLiveStream: require("./upsertLiveStream"),
  upsertProduct: require("./upsertProduct"),
});

// UserProperty("userName", "string"));
// UserProperty("countryCode", "string"));
// UserProperty("languages", "set"));
// UserProperty("latitude", "double"));
// UserProperty("longitude", "double"));
// UserProperty("preferredCategories", "set"));
// UserProperty("preferredTags", "set"));

// ItemProperty("name", "string"));
// ItemProperty("ownerId", "string"));
// ItemProperty("itemType", "string"));
// ItemProperty("type", "string"));
// ItemProperty("countryCode", "string"));
// ItemProperty("language", "string"));
// ItemProperty("categories", "set"));
// ItemProperty("tags", "set"));
// ItemProperty("linkedProductTags", "set"));
// ItemProperty("created", "timestamp"));
// ItemProperty("isAvailable", "boolean"));
// ItemProperty("appropriateForKids", "boolean"));
// ItemProperty("visibility", "string"));
// ItemProperty("tribeIds", "set"));
// ItemProperty("communityIds", "set"));
// ItemProperty("latitude", "double"));
// ItemProperty("longitude", "double"));
// ItemProperty("startTime", "timestamp"));
// ItemProperty("endTime", "timestamp"));
// ItemProperty("duration", "int"));
