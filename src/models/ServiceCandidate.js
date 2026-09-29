const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    normalizedName: String,
    names: [String],
    businessTagId: String,
    market: String,
    businessIds: [String],
    created: { type: Number, default: Date.now, index: true },
  },
  { timestamps: true },
);

const ServiceCandidate = db.db1.model("ServiceCandidate", schema, "service_candidates");

class ExtendedServiceCandidate extends ServiceCandidate {
  static normalizeName(name) {
    const result = name
      .trim()
      .replace(
        /[øØßæÆđĐ]/g,
        (c) => ({ ø: "o", Ø: "O", ß: "ss", æ: "ae", Æ: "AE", đ: "d", Đ: "D" }[c]),
      )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    return result;
  }
}

module.exports = ExtendedServiceCandidate;
