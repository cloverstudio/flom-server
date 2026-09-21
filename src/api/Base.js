const { Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { Localizer } = require("#services");
const { UnexpectedError } = require("#models");

function errorResponse(response, httpCode, message, error) {
  if (message && error) {
    logger.error(message, error);
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
    logger.error(`Error code: ${code}`);

    const { lang } = response;
    delete response.lang;
    const loc = new Localizer(lang);

    response.status(Const.httpCodeSucceed);
    response.set("connection", "Keep-alive");

    response.json({
      code,
      errorMessage: loc.e(code, data),
      time: Date.now(),
    });
  } else {
    Utils.stripPrivateData(data);

    response.json({
      code: Const.responsecodeSucceed,
      time: Date.now(),
      data: !data ? {} : data,
    });
  }
}

function newErrorResponse({ response, code, type, message, error, data, param, param2 }) {
  const request = response.req;
  const deviceType = request.headers["device-type"];

  if (!code) {
    const reference = Utils.getRandomString(8, "limited");

    createUnexpectedError({ reference, error, request });

    logger.error(message + " | Device: " + deviceType + " | Reference: " + reference, error);
    response.status(Const.httpCodeServerError);
    return response.send("");
  }

  const { lang } = response;
  delete response.lang;
  const loc = new Localizer(lang);

  if (code !== Const.responsecodeNoActiveLiveStreamFoundForUser) {
    if (!error)
      logger.error(`Error code: ${code} | Error message: ${message} | Device: ${deviceType}`);
    else
      logger.error(
        `Error code: ${code} | Error message: ${message} | Device: ${deviceType}`,
        error,
      );
  }

  response.status(Const.httpCodeSucceed);
  response.set("connection", "Keep-alive");

  const responseData = {
    code,
    errorMessage: loc.e(code, param, param2),
    time: Date.now(),
  };

  if (data) {
    responseData.data = data;
  }

  response.json(responseData);
}

async function createUnexpectedError({ reference, error, request }) {
  try {
    const info = {
      source: "main_app",
      reference,
      error: { name: error.name, message: error.message, stack: error.stack },
      request: {
        method: request.method,
        path: request.path,
        body: request.body,
        params: request.params,
        query: request.query,
      },
    };

    if (request.user) {
      info.user = {
        _id: request.user._id.toString(),
        userName: request.user.userName,
        phoneNumber: request.user.phoneNumber,
      };
    }

    await UnexpectedError.create(info);
  } catch (err) {
    logger.error("Failed to create unexpected error record: ", err);
  }
}

module.exports = {
  errorResponse,
  successResponse,
  newErrorResponse,
};
