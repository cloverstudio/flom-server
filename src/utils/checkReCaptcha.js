const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function checkReCaptcha(reCaptchaToken, reCaptchaSecret = Config.reCaptchaSecret) {
  try {
    const responseData = await sendRequest({
      method: "POST",
      url: Config.reCaptchaURL,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: {
        secret: reCaptchaSecret,
        response: reCaptchaToken,
      },
    });
    if (responseData["error-codes"]) {
      console.warn(responseData["error-codes"]);
    }
    return responseData?.success || false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

module.exports = checkReCaptcha;
