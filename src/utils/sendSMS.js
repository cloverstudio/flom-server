const twilio = require("twilio");
const { Config } = require("#config");

async function sendSMS(to, body) {
  const twilioClient = twilio(Config.twilio.accountSid, Config.twilio.authToken);

  const smsData = {
    to: to,
    from: Config.twilio.fromNumber,
    body: body,
  };

  return await twilioClient.messages.create(smsData);
}

module.exports = sendSMS;
