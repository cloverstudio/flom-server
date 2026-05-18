const mongoose = require("mongoose");

function createObjectID(id = null) {
  if (!id) {
    return new mongoose.Types.ObjectId();
  }

  return new mongoose.Types.ObjectId(`${id}`);
}

module.exports = createObjectID;
