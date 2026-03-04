const sgMail = require("@sendgrid/mail");
const { Config } = require("#config");

function sendEmailWithSG(subject, text, to) {
  sgMail.setApiKey(Config.sendgridAPIKey);
  const msg = {
    to,
    from: "no-reply@flom.app",
    subject,
    text,
  };
  sgMail.send(msg);
}

module.exports = sendEmailWithSG;
