const crypto = require("crypto");
const { Config } = require("#config");

function hash(string, noSalt = false) {
  return !noSalt
    ? crypto
        .createHash("sha1")
        .update(string + Config.hashSalt)
        .digest("hex")
    : crypto.createHash("sha1").update(string).digest("hex");
}

module.exports = hash;
