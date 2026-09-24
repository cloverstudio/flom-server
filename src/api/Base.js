const { Const } = require("#config");
const { logger } = require("#infra");
const Utils = require("#utils");
const { Localizer } = require("#services");
const { UnexpectedError } = require("#models");

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

  let reference;

  if (!code) {
    code = Const.responsecodeUnexpectedError;

    reference = Utils.getRandomString(8, "limited");
    param = reference;

    createUnexpectedError({ message, reference, error, request });
  }

  const { lang } = response;
  delete response.lang;
  const loc = new Localizer(lang);

  if (code !== Const.responsecodeNoActiveLiveStreamFoundForUser) {
    if (reference)
      logger.error(
        `Error code: ${code} | Error message: Unexpected error | Device: ${deviceType} | Reference: ${reference}`,
        error,
      );
    else if (!error)
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

async function createUnexpectedError({ message, reference, error, request }) {
  try {
    const deviceType = request.headers["device-type"];

    const info = {
      origin: "main_app",
      reference,
      deviceType,
      error: { name: error.name, message: error.message, stack: error.stack },
      api: message,
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
  successResponse,
  newErrorResponse,
};
