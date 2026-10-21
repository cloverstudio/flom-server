const { Config, Const } = require("#config");
const { logger } = require("#infra");

const templates = require("./template-messages");

function createTemplateMessageBody({ template, ...params }) {
  if (!template || !templates[template]) {
    logger.error(`createTemplateMessageBody error, invalid template: ${template}`);
    return null;
  }

  const templatePattern = templates[template];

  const headerParams = templatePattern.headerParams || [];
  const textParams = templatePattern.textParams || [];
  const buttonParams = templatePattern.buttonParams || [];
  const allParamNames = [...headerParams, ...textParams, ...buttonParams];

  for (const param of allParamNames) {
    if (!params[param]) {
      logger.error(
        `createTemplateMessageBody error, missing parameter: ${param} for template: ${template}`,
      );
      return null;
    }
  }

  const base = {
    name: Const.templateMap[template],
    language: {
      code: "en",
      //code: "en_US",
    },
    components: [],
  };

  /*
  "type": "image",
            "image": { "link": "https://example.com/images/offer-123.jpg" }
            */

  if (headerParams.length > 0) {
    for (let i = 0; i < headerParams.length; i++) {
      const param = headerParams[i];
      const paramType = param.includes("Text")
        ? "text"
        : param.includes("Image")
        ? "image"
        : "text";
      const paramValue =
        paramType === "text" ? { text: params[param] } : { image: { link: params[param] } };

      if (i === 0) {
        base.components.push({
          type: "header",
          parameters: [
            {
              type: paramType,
              ...paramValue,
            },
          ],
        });
      } else {
        const component = base.components.find((c) => c.type === "header");
        component.parameters.push({
          type: paramType,
          ...paramValue,
        });
      }
    }
  }

  if (textParams.length > 0) {
    for (let i = 0; i < textParams.length; i++) {
      const param = textParams[i];

      if (i === 0) {
        base.components.push({
          type: "body",
          parameters: [
            {
              type: "text",
              text: params[param],
            },
          ],
        });
      } else {
        const component = base.components.find((c) => c.type === "body");
        component.parameters.push({
          type: "text",
          text: params[param],
        });
      }
    }
  }

  if (buttonParams.length > 0) {
    for (let i = 0; i < buttonParams.length; i++) {
      const param = buttonParams[i];

      base.components.push({
        type: "button",
        sub_type: "url",
        index: String(i),
        parameters: [
          {
            type: "text",
            text: params[param],
          },
        ],
      });
    }
  }

  return base;
}

const deepLink = {
  order: `https://flom.app/order?id=`,
  auction: `https://flom.app/auction?id=`,
  liveStream: `https://flom.app/livestream?id=`,
  product: `https://flom.app/product?id=`,
};

module.exports = createTemplateMessageBody;
