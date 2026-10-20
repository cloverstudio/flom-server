"use strict";

const router = require("express").Router();
const { logger } = require("#infra");
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, SupportTicket, Order } = require("#models");
const mediaHandler = require("#media");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

/**
 * @api {post} /api/v2/support/file/code Create support ticket with files using verification code flom_v1
 * @apiVersion 2.0.25
 * @apiName  Create support ticket with files flom_v1
 * @apiGroup WebAPI Support
 * @apiDescription  API which is called to create a new support ticket, with files. All non-file data is sent in a "data" string which contains a stringified object.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Form data) {Object}  data               Stringified object
 * @apiParam (Form data) {String}  data.orderToken    Order token
 * @apiParam (Form data) {String}  data.code          Verification code
 * @apiParam (Form data) {String}  [data.email]       Contact email.
 * @apiParam (Form data) {String}  data.type          Type parameter from the category selected. (bug_report, order_issue)
 * @apiParam (Form data) {String}  data.description   Description of what happened.
 * @apiParam (Form data) {String}  data.referenceId   Reference ID related to the support ticket.
 * @apiParam (Form data) {File}    file0              File (images and audios only) (subsequent files are named file1, file2 and so on)
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "submitted": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443940 Order not found
 * @apiError (Errors) 444016 Invalid code
 * @apiError (Errors) 444017 Code expired
 * @apiError (Errors) 443236 Description parameter is missing
 * @apiError (Errors) 443127 Type parameter is missing
 * @apiError (Errors) 443226 Invalid type parameter
 * @apiError (Errors) 443129 ReferenceId parameter is missing
 * @apiError (Errors) 444013 Referenced item not found
 */

router.post("/code", async function (request, response) {
  try {
    const { fields, files } = await Utils.formParse(request, {
      keepExtensions: true,
      uploadDir: Config.uploadPath,
    });

    const data = !fields.data ? {} : JSON.parse(fields.data);
    const { orderToken, code, email, description, type, referenceId } = data;

    const {
      order,
      success,
      code: errorCode,
      msg,
    } = await Logics.confirmOrderCode({ orderToken, code });
    if (!success) {
      return Base.errorResponse({
        response,
        code: errorCode,
        message: "SupportWithFileController - create ticket using code, " + msg,
      });
    }

    const buyer = await User.findById(order.buyer._id).lean();

    const {
      ticket,
      code: ticketErrorCode,
      msg: ticketMsg,
    } = await createTicket({
      email,
      description,
      type,
      referenceId,
      user: buyer,
      files,
    });

    if (ticketErrorCode) {
      return Base.errorResponse({
        response,
        code: ticketErrorCode,
        message: "SupportWithFileController - create ticket using code, " + ticketMsg,
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { submitted: true });

    processFiles({ files, ticketId: ticket._id.toString() });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "SupportWithFileController - create ticket using code",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/support/file Create support ticket with files flom_v1
 * @apiVersion 2.0.25
 * @apiName  Create support ticket with files flom_v1
 * @apiGroup WebAPI Support
 * @apiDescription  API which is called to create a new support ticket, with files. All non-file data is sent in a "data" string which contains a stringified object.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Form data) {Object}  data               Stringified object
 * @apiParam (Form data) {String}  [data.email]       Contact email.
 * @apiParam (Form data) {String}  data.type          Type parameter from the category selected. (bug_report, order_issue)
 * @apiParam (Form data) {String}  data.description   Description of what happened.
 * @apiParam (Form data) {String}  data.referenceId   Reference ID related to the support ticket.
 * @apiParam (Form data) {File}    file0              File (images and audios only) (subsequent files are named file1, file2 and so on)
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "submitted": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443236 Description parameter is missing
 * @apiError (Errors) 443127 Type parameter is missing
 * @apiError (Errors) 443226 Invalid type parameter
 * @apiError (Errors) 443129 ReferenceId parameter is missing
 * @apiError (Errors) 444013 Referenced item not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { fields, files } = await Utils.formParse(request, {
      keepExtensions: true,
      uploadDir: Config.uploadPath,
    });

    const data = !fields.data ? {} : JSON.parse(fields.data);
    const { email, description, type, referenceId } = data;

    const {
      ticket,
      code: ticketErrorCode,
      msg: ticketMsg,
    } = await createTicket({
      email,
      description,
      type,
      referenceId,
      user,
    });

    if (ticketErrorCode) {
      return Base.errorResponse({
        response,
        code: ticketErrorCode,
        message: "SupportWithFileController - create ticket, " + ticketMsg,
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { submitted: true });

    processFiles({ files, ticketId: ticket._id.toString() });
  } catch (error) {
    Base.errorResponse({
      response,
      message: "SupportWithFileController - create ticket",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/support/file/:fileName Get support ticket file flom_v1
 * @apiVersion 2.0.25
 * @apiName Get support ticket file flom_v1
 * @apiGroup WebAPI Support
 * @apiDescription API for getting support ticket file. Access allowed only for admin page, for support ticket reviewer, admin, superadmin.
 *
 * @apiHeader {String} access-token Users unique access-token. Admin page only: support ticket reviewer, admin, superadmin.
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443391 File not found
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Unauthorized
 */

router.get(
  "/:nameOnServer",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.SUPPORT_TICKET_REVIEWER, Const.Role.ADMIN, Const.Role.SUPER_ADMIN],
  }),
  async function (request, response) {
    try {
      const { nameOnServer } = request.params;
      const filePath = path.resolve(Config.supportFilesPath, nameOnServer);

      if (fs.existsSync(filePath)) {
        return response.sendFile(filePath);
      }

      response.sendStatus(404);
    } catch (error) {
      Base.errorResponse({
        response,
        message: "SupportWithFileController - get support file",
        error,
      });
    }
  },
);

async function createTicket({ email, description, type, referenceId, user, files }) {
  const userId = !user ? null : user._id.toString();

  if (!description) {
    return {
      code: Const.responsecodeNoDescription,
      message: "no description",
    };
  }
  if (!type) {
    return {
      code: Const.responsecodeNoTypeParameter,
      message: "no type",
    };
  }

  if (!["bug_report", "order_issue"].includes(type)) {
    return {
      code: Const.responsecodeInvalidTypeParameter,
      message: "invalid type",
    };
  }

  if (type === "order_issue") {
    if (!referenceId) {
      return {
        code: Const.responsecodeNoReferenceIdParameter,
        message: "no referenceId",
      };
    }
    if (!Utils.isValidObjectId(referenceId)) {
      return {
        code: Const.responsecodeReferencedItemNotFound,
        message: "referenceId not a valid Id",
      };
    }

    const order = await Order.findById(referenceId);
    if (!order) {
      return {
        code: Const.responsecodeReferencedItemNotFound,
        message: "invalid reference ID for order issue",
      };
    }
  }

  const supportTicketData = {
    type,
    status: 1,
    description,
    userId,
    referenceId,
    userPhoneNumber: user ? user.phoneNumber : null,
    email,
    mediaProcessingInfo: { status: "processing" },
  };

  if (email && userId) {
    await User.findByIdAndUpdate(userId, { email });
  }

  const ticket = await SupportTicket.create(supportTicketData);
  const ticketId = ticket._id.toString();

  if (email) {
    const text = `Support ticket type: ${type}\n` + JSON.stringify({ supportTicketData });
    const supportEmailSubject =
      type === "order_issue" ? "Order issue ticket (Flom v1)" : "Bug report ticket (Flom v1)";
    const supportEmail = Config.supportEmail;
    Utils.sendEmailWithSG({ subject: supportEmailSubject, text, to: supportEmail });
  }

  if (type === "order_issue" && referenceId) {
    await Order.findByIdAndUpdate(referenceId, {
      supportTicketId: ticketId,
      status: Const.orderStatus.SUPPORT_TICKET_OPENED,
      ticketCreator: userId,
    });
  }

  return { ticket };
}

async function processFiles({ files, ticketId }) {
  try {
    if (Object.keys(files).length > 0) {
      const ticketFiles = [];

      for (const key in files) {
        const file = files[key];
        const { name: oldName, type: fileType, path: oldPath, size } = file;

        if (!fileType.includes("image") && !fileType.includes("audio")) continue;

        const { width, height, duration } = await mediaHandler.getMediaInfo(oldPath);

        const extension = oldName.split(".").pop();

        let nameExists = true,
          newName;
        while (nameExists) {
          newName = Utils.getRandomString(32);

          if (!fs.existsSync(path.resolve(Config.supportFilesPath, `${newName}.${extension}`))) {
            nameExists = false;
          }
        }

        const newPath = path.resolve(Config.supportFilesPath, `${newName}.${extension}`);

        await fsp.copyFile(oldPath, newPath);
        await fsp.unlink(oldPath);

        const info = {
          nameOnServer: `${newName}.${extension}`,
          mimeType: fileType,
          size,
          width,
          height,
          duration,
        };
        ticketFiles.push(info);
      }

      if (ticketFiles.length > 0) {
        await SupportTicket.findByIdAndUpdate(ticketId, {
          files: ticketFiles,
          "mediaProcessingInfo.status": "completed",
        });
      }
    }
  } catch (error) {
    logger.error("SupportWithFileController - create ticket, file processing", error);

    await SupportTicket.findByIdAndUpdate(ticketId, {
      "mediaProcessingInfo.status": "failed",
      "mediaProcessingInfo.error": error.message,
    });

    return;
  }
}

module.exports = router;
