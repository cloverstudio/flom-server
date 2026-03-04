const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function sendSMSv2({ phoneNumber, message, type }) {
  try {
    await sendRequest({
      method: "POST",
      url: Config.smsServiceUrl,
      headers: {
        "Content-Type": "application/json",
        token: Config.smsServiceToken,
      },
      body: {
        to: phoneNumber,
        message,
        type,
      },
      // resolveWithFullResponse: true,
    });
  } catch (error) {
    console.log("sendSMSv2 error: " + JSON.stringify(error));
  }
}

module.exports = sendSMSv2;
