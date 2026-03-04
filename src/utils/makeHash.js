const crypto = require("crypto");
const { Config } = require("#config");

function makeHash() {
  const currentSeconds = Math.floor(Date.now() / 1000);
  const hash = crypto
    .createHash("sha256")
    .update(currentSeconds.toString() + Config.hackSalt)
    .digest("hex");

  return hash;
}

module.exports = makeHash;
