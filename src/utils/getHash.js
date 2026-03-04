const crypto = require("crypto");
const { Config } = require("#config");

function getHash(string) {
  return crypto
    .createHash("sha1")
    .update(string + Config.hashSalt)
    .digest("hex");
}

module.exports = getHash;
