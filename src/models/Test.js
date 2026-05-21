const { db } = require("#infra");
const mongoose = require("mongoose");
const User = require("./User");

function baseModelPlugin(schema) {
  schema.statics.testFn = function () {
    console.log("Test function called");
  };
}

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    value: {},
    userId: String,
    num: Number,
    headers: {},
    created: { type: Number, default: Date.now },
    datetime: Date,
  },
  { timestamps: true },
);

schema.post("findOne", async function (doc) {
  if (doc.userId) {
    const user = await User.findById(doc.userId).lean();

    doc.user = user;
  }

  return doc;
});

schema.plugin(baseModelPlugin);

module.exports = db.db1.model("Test", schema, "tests");
