const { Const, Config } = require("#config");
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
    const reference = createReference();

    logger.error(`ERROR CODE: ${code} | REFERENCE: ${reference}`);

    const { lang } = response;
    delete response.lang;
    const loc = new Localizer(lang);

    response.status(Const.httpCodeSucceed);
    response.set("connection", "Keep-alive");

    response.json({
      code,
      errorMessage: loc.e(code, data) + ` (Ref: ${reference})`,
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

function errorResponse({ response, code, type, message, error, data, param, param2 }) {
  const request = response.req;
  const deviceType = request.headers["device-type"];

  const reference = createReference();

  if (!code) {
    code = Const.responsecodeUnexpectedError;
    createUnexpectedError({ message, reference, error, request });
  }

  const { lang } = response;
  delete response.lang;
  const loc = new Localizer(lang);

  if (code !== Const.responsecodeNoActiveLiveStreamFoundForUser) {
    if (reference)
      logger.error(
        `Code: ${code} | Message: Unexpected error | ${deviceType} | Ref: ${reference}`,
        error,
      );
    else if (!error)
      logger.error(`Code: ${code} | Message: ${message} | ${deviceType} | Ref: ${reference}`);
    else
      logger.error(
        `Code: ${code} | Message: ${message} | ${deviceType} | Ref: ${reference}`,
        error,
      );
  }

  response.status(Const.httpCodeSucceed);
  response.set("connection", "Keep-alive");

  const responseData = {
    code,
    errorMessage: loc.e(code, param, param2) + ` (Ref: ${reference})`,
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
    const i = Config.instance || "0";

    const info = {
      origin: "main_app_" + i,
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

let refArray = [];

function createReference() {
  if (refArray.length > 1000) {
    refArray = [];
  }

  const i = Config.instance || "0";

  let ref,
    refExists = true;

  while (refExists) {
    ref = Utils.generateRandomString(8, "limited");
    refExists = refArray.includes(ref);
    refArray.push(ref);
  }

  return `M${i}-${ref}`;
}

module.exports = {
  successResponse,
  errorResponse,
};
