const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    productId: String,
    productName: String,
    productType: Number,
    oldProductStatus: Number,
    newProductStatus: Number,
    oldProductComment: String,
    newProductComment: String,
    adminUserId: String,
    adminUsername: String,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("ProductModerationLog", schema, "product_moderation_logs");
