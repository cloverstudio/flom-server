"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { UserContact, User } = require("#models");

/**
      * @api {get} /api/v2/user/getContacts User Get Contacts
      * @apiName User Get Contacts
      * @apiGroup WebAPI
      * @apiDescription User Get Contacts
      
      * @apiHeader {String} access-token Users unique access-token.

      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1507293117920,
            "data": {
                "users": [
                    {
                        "_id": "59df1bde5f62d1632b3ba381",
                        "created": 1507793886231,
                        "phoneNumber": "+385989057351",
                        "userid": "+385989057351",
                        "name": "Jura",
                        "description": "jura opis",
                        "avatar": {
                            "thumbnail": {
                                "originalName": "images.jpg",
                                "size": 7897,
                                "mimeType": "jpeg",
                                "nameOnServer": "pYasg5hAJG1YFmPRFQjFMZ2XeBR021EY"
                            },
                            "picture": {
                                "originalName": "images.jpg",
                                "size": 3269,
                                "mimeType": "image/jpeg",
                                "nameOnServer": "WKYwoIcIG4PVykzFudK4Z1jjQQGzyYpp"
                            }
                        },
                        "userContactName": "jura mobile"
                    }
                ]
            }
        }
 
     */

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const user = request.user;

    if (!user) {
      return Base.successResponse(response, Const.responsecodeInvalidToken);
    }

    const contacts = await UserContact.find({ userId: user._id.toString() });
    const contactIds = contacts.map((contact) => contact.contactId);
    const users = await User.find(
      { _id: { $in: contactIds } },
      {
        userid: true,
        phoneNumber: true,
        name: true,
        description: true,
        avatar: true,
        created: true,
      },
    ).lean();

    const usersWithContactName = users.map((user) => {
      const userContact = contacts.find(
        (contact) => contact.contactId.toString() === user._id.toString(),
      );
      return {
        ...user,
        userContactName: userContact ? userContact.name : null,
      };
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      users: usersWithContactName,
    });
  } catch (error) {
    Base.successResponse(response, Const.httpCodeServerError, "UserGetContactsController", error);
  }
});

module.exports = router;
