const { Config } = require("#config");

function setCookies(response, accessToken, userId, origin) {
  const cookieConfig = { ...Config.cookieConfig };

  if (
    origin &&
    (origin.includes("localhost") || origin.includes("192.168") || origin.includes("10."))
  ) {
    delete cookieConfig.sameSite;
    cookieConfig.sameSite = "None";
  }

  response.cookie("access-token", accessToken, cookieConfig);
  response.cookie("userId", userId, cookieConfig);

  const cookieConfigIsLoggedIn = { ...cookieConfig };
  cookieConfigIsLoggedIn.httpOnly = false;
  response.cookie("isLoggedIn", true, cookieConfigIsLoggedIn);
}

module.exports = setCookies;
