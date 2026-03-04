const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subCategoryId: { type: String, required: true },
  },
  { timestamps: true },
);

schema.index({ name: 1, subCategoryId: 1 }, { unique: true });

module.exports = db.db1.model("VehicleMake", schema, "vehicle_makes");
