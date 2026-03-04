module.exports = Object.freeze({
  get upsertUser() {
    return require("./upsertUser");
  },
  get deactivateLiveStreams() {
    return require("./deactivateLiveStreams");
  },
  get deleteAllItems() {
    return require("./deleteAllItems");
  },
  get deleteAllUsers() {
    return require("./deleteAllUsers");
  },
  get getNextRecommendations() {
    return require("./getNextRecommendations");
  },
  get getRecommendations() {
    return require("./getRecommendations");
  },
  get recordInteraction() {
    return require("./recordInteraction");
  },
  get syncLiveStreams() {
    return require("./syncLiveStreams");
  },
  get syncProducts() {
    return require("./syncProducts");
  },
  get syncPurchases() {
    return require("./syncPurchases");
  },
  get syncUsers() {
    return require("./syncUsers");
  },
  get upsertLiveStream() {
    return require("./upsertLiveStream");
  },
  get upsertProduct() {
    return require("./upsertProduct");
  },
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
