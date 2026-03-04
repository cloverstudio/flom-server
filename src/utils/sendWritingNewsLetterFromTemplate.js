const fs = require("fs-extra");
const handlebars = require("handlebars");
const sgMail = require("@sendgrid/mail");
const { Config } = require("#config");

async function sendWritingNewsLetterFromTemplate({
  from = "no-reply@flom.app",
  to,
  subject,
  templatePath = "src/email-templates/writingNewsletter.html",
  product,
  similarProducts,
} = {}) {
  try {
    if (!templatePath) {
      throw new Error("No template path");
    }
    if (!fs.existsSync(templatePath)) {
      throw new Error("Invalid template path");
    }

    const createWritingItem = ({
      product,
      baseUrl = "https://v1.flom.app",
      discoverUrl = "https://discover.flom.app",
    }) => {
      const createUserProfileUrl = ({ username, discoverUrl = "https://discover.flom.app" }) => {
        if (!username) return null;

        return discoverUrl + "/discover/user-profile/" + username;
      };

      const createAvatarUrl = ({
        nameOnServer,
        baseUrl = "https://v1.flom.app",
        discoverUrl = "https://discover.flom.app",
      }) => {
        if (!nameOnServer) return discoverUrl + "/assets/avatar_null.png";

        return baseUrl + "/uploads/" + nameOnServer;
      };

      const parseDescription = (description) => {
        if (!description) return "";

        const extractTextFormParagraphs = (paragraphs = []) => {
          let paragraphText = "";

          paragraphs.forEach((paragraph) => {
            if (paragraph.paragraphType === "p") {
              paragraphText += paragraph.text + "<br>";
            }
          });

          return paragraphText;
        };

        if (description.startsWith('{"paragraphs":')) {
          const parsedDescription = JSON.parse(description);
          return extractTextFormParagraphs(parsedDescription?.paragraphs).substring(0, 145);
        } else {
          return description.substring(0, 145);
        }
      };

      const createWritingThumbnailUrl = ({
        nameOnServer,
        baseUrl = "https://v1.flom.app",
        discoverUrl = "https://discover.flom.app",
      }) => {
        if (!nameOnServer) return discoverUrl + "/assets/text_story_icon.png"; //fallback .svg not working, need .png

        return baseUrl + "/uploads/" + nameOnServer;
      };

      const createWritingDetailsUrl = ({ _id, discoverUrl = "https://discover.flom.app" }) => {
        if (!_id) return discoverUrl;

        return discoverUrl + "/discover/details/" + _id;
      };

      const { owner = {}, name, description, file, _id } = product || {};

      return {
        discoverUrl,
        userProfileUrl: createUserProfileUrl({ username: owner.userName, discoverUrl }),
        avatarUrl: createAvatarUrl({
          nameOnServer: owner.avatar?.thumbnail.nameOnServer,
          baseUrl,
        }),
        username: owner.userName,
        title: name,
        text: parseDescription(description),
        writingThumbnailUrl: createWritingThumbnailUrl({
          nameOnServer: file[0]?.thumb?.nameOnServer,
          baseUrl,
          discoverUrl,
        }),
        writingUrlDetails: createWritingDetailsUrl({ _id, discoverUrl }),
      };
    };

    const createSimilarWritings = ({
      similarProducts,
      baseUrl = "https://v1.flom.app",
      discoverUrl = "https://discover.flom.app",
    }) => {
      const similarWritings = similarProducts.map((product) => {
        return createWritingItem({ product, baseUrl, discoverUrl });
      });

      return similarWritings;
    };

    const discoverUrl = process.env.DISCOVER_URL; // this should be moved to env
    const baseUrl = process.env.WEB_CLIENT_URL; // also env it is used for upload path

    const mainWriting = createWritingItem({ product, baseUrl, discoverUrl });
    const similarWritings = createSimilarWritings({ similarProducts, baseUrl, discoverUrl });

    const templateHtml = fs.readFileSync(templatePath, { encoding: "utf-8" });
    const template = handlebars.compile(templateHtml);

    const html = template({ discoverUrl, mainWriting, similarWritings });

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
    console.log("sendWritingNewsLetterFromTemplate error");
    if (error.response) {
      console.error(error.response.body);
      console.log("sendWritingNewsLetterFromTemplate error");
    }
  }
}

module.exports = sendWritingNewsLetterFromTemplate;
