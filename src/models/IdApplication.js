const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: String,
    userName: String,
    phoneNumber: String,
    countryCode: String,
    country: String,
    firstName: String,
    lastName: String,
    dateOfBirth: Number,
    idPhotos: [],
    approvalStatus: { type: Number, default: Const.idApplicationStatusPending },
    approvalComment: String,
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("IdApplication", schema, "id_applications");
