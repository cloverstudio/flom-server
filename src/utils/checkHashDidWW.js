const crypto = require("crypto");
const { Config } = require("#config");

function checkHashDidWW(hash, seconds, destinationPhoneNumber) {
  if (Config.environment === "development") return true;

  const currentSeconds = Math.floor(Date.now() / 1000);

  for (let i = 0; i <= seconds; i++) {
    const testHash = crypto
      .createHash("sha256")
      .update(destinationPhoneNumber + (currentSeconds - i).toString() + Config.hackSalt)
      .digest("hex");

    if (testHash === hash) return true;
  }

  return false;
}

module.exports = checkHashDidWW;
