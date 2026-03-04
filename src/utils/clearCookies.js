const { Config } = require("#config");

function clearCookies(response, origin) {
  const cookieConfig = { ...Config.cookieConfig };

  if (
    origin &&
    (origin.includes("localhost") || origin.includes("192.168") || origin.includes("10."))
  ) {
    // delete cookieConfig.domain;
    delete cookieConfig.sameSite;
    cookieConfig.sameSite = "None";
  }

  response.clearCookie("access-token", cookieConfig);
  response.clearCookie("userId", cookieConfig);
  const cookieConfigIsLoggedIn = { ...cookieConfig };
  cookieConfigIsLoggedIn.httpOnly = false;
  response.cookie("isLoggedIn", false, cookieConfigIsLoggedIn);
}

module.exports = clearCookies;
