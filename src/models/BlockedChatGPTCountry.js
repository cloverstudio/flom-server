const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema({ countryCode: String }, { timestamps: true });
schema.index({ countryCode: 1 });

module.exports = db.db1.model("BlockedChatGPTCountry", schema, "blocked_chatGPT_countries");
