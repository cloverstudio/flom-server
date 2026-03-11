const { Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { Localizer } = require("#services");

function errorResponse(response, httpCode, message, error) {
  if (message && error) {
    logger.warn(message, error);
  }
  response.status(httpCode);
  response.send("");
}

//if code != Const.responsecodeSucceed -> data param will be used for localizer to send dynamic parameter to error message
//in code == Const.responsecodeSucceed -> data param will be used regularly to send data back to client
function successResponse(response, code, data) {
  response.status(Const.httpCodeSucceed);
  response.set("connection", "Keep-alive");

  if (code != Const.responsecodeSucceed) {
    logger.warn(`Error code: ${code}`);

    const { lang } = response;
    delete response.lang;
    const loc = new Localizer(lang);

    response.status(Const.httpCodeSucceed);
    response.set("connection", "Keep-alive");

    response.json({
      code,
      errorMessage: loc.e(code, data),
      time: Utils.now(),
    });
  } else {
    Utils.stripPrivateData(data);

    response.json({
      code: Const.responsecodeSucceed,
      time: Utils.now(),
      data: !data ? {} : data,
    });
  }
}

function newErrorResponse({ response, code, type, message, error, data, param, param2 }) {
  if (!code) {
    logger.error(message, error);
    response.status(Const.httpCodeServerError);
    return response.send("");
  }

  const { lang } = response;
  delete response.lang;
  const loc = new Localizer(lang);

  if (code !== Const.responsecodeNoActiveLiveStreamFoundForUser) {
    if (!error) logger.warn(`Error code: ${code} | Error message: ${message}`);
    else logger.warn(`Error code: ${code} | Error message: ${message}`, error);
  }

  response.status(Const.httpCodeSucceed);
  response.set("connection", "Keep-alive");

  const responseData = {
    code,
    errorMessage: loc.e(code, param, param2),
    time: Utils.now(),
  };

  if (data) {
    responseData.data = data;
  }

  response.json(responseData);
}

module.exports = {
  errorResponse,
  successResponse,
  newErrorResponse,
};
