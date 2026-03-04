const twilio = require("twilio");
const { Config } = require("#config");

function sendSmsNew({ to, from = Config.twilio.fromNumbers[0], body }) {
  const twilioClient = twilio(Config.twilio.accountSid, Config.twilio.authToken);
  console.log("New SMS to send");
  console.log({ to, from, body });

  return twilioClient.messages.create({
    to,
    from,
    body,
    callback: function (err, message) {
      if (err) {
        reject(err.message);
      }
      resolve(message);
    },
  });
}

module.exports = sendSmsNew;
