const crypto = require("crypto");
const { Config } = require("#config");

function checkHash(hash) {
  if (Config.environment === "development") return true;

  const currentSeconds = Math.floor(Date.now() / 1000);

  for (let i = 0; i <= 10; i++) {
    const testHash = crypto
      .createHash("sha256")
      .update((currentSeconds - i).toString() + Config.hackSalt)
      .digest("hex");

    if (testHash === hash) return true;
  }

  return false;
}

module.exports = checkHash;
