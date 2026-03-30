const twilio = require("twilio");
const { Config } = require("#config");

async function sendSmsNew({ to, from = Config.twilio.fromNumbers[0], body }) {
  const twilioClient = twilio(Config.twilio.accountSid, Config.twilio.authToken);
  console.log("New SMS to send");
  console.log({ to, from, body });

  return await twilioClient.messages.create({ to, from, body });
}

module.exports = sendSmsNew;
