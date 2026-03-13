const mongoose = require("mongoose");

function toObjectId(id) {
  const oid = new mongoose.Types.ObjectId(`${id}`);
  return oid;
}

module.exports = toObjectId;
