const { db } = require("#infra");
const mongoose = require("mongoose");

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

schema.post("find", async function (doc) {
  console.log("Post find hook - Test model");
});

const Test = db.db1.model("Test", schema, "tests");

class Test2 extends Test {
  static invokeTestFn(x) {
    this.testFunction(x);
  }

  static testFunction(x) {
    console.log("Test function", x);
  }
}

module.exports = Test2;
