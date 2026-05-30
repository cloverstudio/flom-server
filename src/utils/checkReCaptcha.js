const { Config } = require("#config");
const sendRequest = require("./sendRequestV2");

async function checkReCaptcha(reCaptchaToken, reCaptchaSecret = Config.reCaptchaSecret) {
  try {
    const { data: responseData = {} } = await sendRequest({
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
    if (!responseData) {
      console.warn("checkReCaptcha: no response data");
      return false;
    }
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
