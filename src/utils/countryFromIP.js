const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function countryFromIP(IPAddress) {
  const response = await sendRequest({
    method: "GET",
    uri: `https://pro.ip-api.com/json/${IPAddress}`,
    qs: {
      key: Config.proIPApiKey,
      fields: "countryCode,proxy",
    },
  });

  if (response) {
    if (response.proxy) {
      return "VPN Land";
    }
    return response.countryCode;
  }
}

module.exports = countryFromIP;
