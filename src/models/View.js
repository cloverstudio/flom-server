const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    productId: String,
    userId: String,
    productType: Number,
    created: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

schema.statics.getDefaultResponseFields = function () {
  return {
    _id: true,
    productId: true,
    userId: true,
    productType: true,
    created: true,
  };
};

module.exports = db.db1.model("View", schema, "views");
