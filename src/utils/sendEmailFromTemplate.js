const fs = require("fs-extra");
const handlebars = require("handlebars");
const sgMail = require("@sendgrid/mail");
const { Config } = require("#config");

async function sendEmailFromTemplate({
  from = "no-reply@flom.app",
  to,
  subject,
  text,
  templatePath,
  templateDataInput = null,
  baseUrlInput = null,
} = {}) {
  try {
    if (!templatePath) {
      throw new Error("No template path");
    }
    if (!fs.existsSync(templatePath)) {
      throw new Error("Invalid template path");
    }

    const templateHtml = fs.readFileSync(templatePath, { encoding: "utf-8" });
    const template = handlebars.compile(templateHtml);

    const baseUrl = baseUrlInput ?? Config.webClientUrl;
    const templateData = templateDataInput ?? { baseUrl, subject, text };
    if (!templateData.baseUrl) {
      templateData.baseUrl = baseUrl;
    }

    const html = template(templateData);

    sgMail.setApiKey(Config.sendgridAPIKey);
    const msg = {
      to,
      from,
      subject,
      ...(html && { html }),
    };
    await sgMail.send(msg);
  } catch (error) {
    console.error(error);
    console.log("sendEmailFromTemplate error");
    if (error.response) {
      console.error(error.response.body);
      console.log("sendEmailFromTemplate error");
    }
  }
}

module.exports = sendEmailFromTemplate;
