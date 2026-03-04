"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, SupportTicket } = require("#models");
const mediaHandler = require("#media");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

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
 * @apiParam (Form data) {String}  data.type          Type parameter from the category selected. (bug_report)
 * @apiParam (Form data) {String}  data.description   Description of what happened.
 * @apiParam (Form data) {File}    file0              File (images only) (subsequent files are named file1, file2 and so on)
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const userId = user._id.toString();
    const { fields, files } = await Utils.formParse(request, {
      keepExtensions: true,
      uploadDir: Config.uploadPath,
    });

    const data = !fields.data ? {} : JSON.parse(fields.data);
    const { email, description, type } = data;

    if (!description) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoDescription,
        message: "SupportWithFileController - create ticket, no description",
      });
    }
    if (!type) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoTypeParameter,
        message: "SupportWithFileController - create ticket, no type",
      });
    }

    const supportTicketData = {
      type,
      status: 1,
      description,
      userId,
      // referenceId,
      userPhoneNumber: user.phoneNumber,
      email,
      mediaProcessingInfo: { status: "processing" },
    };

    if (email) {
      await User.findByIdAndUpdate(userId, { email });
    }

    const ticket = await SupportTicket.create(supportTicketData);
    const ticketId = ticket._id.toString();

    if (email) {
      const text = `Support ticket type: ${type}\n` + JSON.stringify({ supportTicketData });
      const supportEmailSubject = "Bug report ticket (Flom v1)";
      const supportEmail = Config.supportEmail;
      Utils.sendEmailWithSG(supportEmailSubject, text, supportEmail);
    }

    Base.successResponse(response, Const.responsecodeSucceed, { submitted: true });

    // files processing
    try {
      if (Object.keys(files).length > 0) {
        const ticketFiles = [];

        for (const key in files) {
          const file = files[key];
          const { name: oldName, type: fileType, path: oldPath, size } = file;

          if (!fileType.includes("image")) continue;

          const { width, height } = await mediaHandler.getImageInfo(oldPath);

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
            duration: 0,
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
  } catch (error) {
    Base.newErrorResponse({
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
      Base.newErrorResponse({
        response,
        message: "SupportWithFileController - get support file",
        error,
      });
    }
  },
);

module.exports = router;
