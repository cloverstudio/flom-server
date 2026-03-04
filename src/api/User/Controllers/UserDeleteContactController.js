"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { UserContact } = require("#models");

/**
      * @api {get} /api/v2/user/deleteContact/:contactId User Delete Contact
      * @apiName User Delete Contact
      * @apiGroup WebAPI
      * @apiDescription User Delete Contact
      
      * @apiHeader {String} access-token Users unique access-token.

      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1507293117920,
            "data": {}
        }
 
     */

router.get("/:contactId", auth({ allowUser: true }), async (request, response) => {
  try {
    const user = request.user;
    const contactId = request.params.contactId;

    if (!contactId) {
      return Base.successResponse(response, Const.responsecodeWrongUserContactId);
    }

    const contact = await UserContact.findOne({
      userId: user._id.toString(),
      contactId: contactId,
    });

    if (!contact) {
      return Base.successResponse(response, Const.responsecodeWrongUserContactId);
    }

    await UserContact.deleteMany({
      userId: user._id.toString(),
      contactId: contactId,
    });

    return Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.successResponse(
      response,
      Const.responsecodeUnknownError,
      "UserDeleteContactController",
      error,
    );
  }
});

module.exports = router;
