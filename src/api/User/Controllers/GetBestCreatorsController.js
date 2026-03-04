"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Product } = require("#models");

/**
 * @api {get} api/v2/users/best-creators Best creators API
 * @apiVersion 0.0.1
 * @apiName Best creators API
 * @apiGroup WebAPI Products
 * @apiDescription API that can be used to fetch the list of the best creators.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1657090571621,
 *     "data": {
 *         "users": [
 *             {
 *                 "_id": "5f7ee464a283bc433d9d722f",
 *                 "created": 1602151524372,
 *                 "name": "mdragic",
 *                 "avatar": {
 *                     "picture": {
 *                         "originalName": "cropped2444207444774310745.jpg",
 *                         "size": 4698848,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *                     },
 *                     "thumbnail": {
 *                         "originalName": "cropped2444207444774310745.jpg",
 *                         "size": 97900,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *                     }
 *                 },
 *                 "userName": "mdragic",
 *                 "phoneNumber": "+2348020000007"
 *             },
 *             .
 *             .
 *             .
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;
    // var users = await User
    //   .find({ featuredProductTypes: { $size: 5 }, "isDeleted.value": false })
    //   .limit(Const.newPagingRows)
    //   .lean();
    let usersFromUserCountry = [];
    if (user.featured && user.featured.countryCode && user.featured.countryCode !== "default") {
      usersFromUserCountry = await User.aggregate([
        {
          $match: {
            "featured.types": { $size: 5 },
            "isDeleted.value": false,
            "featured.countryCode": user.featured.countryCode,
          },
        },
        {
          $sample: { size: 12 },
        },
      ]);
    }

    let usersFromDefaultCountry = await User.aggregate([
      {
        $match: {
          "featured.types": { $size: 5 },
          "isDeleted.value": false,
          "featured.countryCode": "default",
        },
      },
      {
        $sample: { size: 12 - usersFromUserCountry.length || 0 },
      },
    ]);

    const users = [...usersFromUserCountry, ...usersFromDefaultCountry];

    for (var featuredUser of users) {
      const userProductsCount = await Product.find({
        ownerId: featuredUser._id.toString(),
        isDeleted: false,
      }).countDocuments();
      const sumOflikes = await Product.aggregate([
        { $match: { isDeleted: false, ownerId: featuredUser._id.toString() } },
        { $group: { _id: null, sum_val: { $sum: "$numberOfLikes" } } },
      ]);
      featuredUser.popularity = Number(sumOflikes[0]?.sum_val) / Number(userProductsCount) || 0;
    }

    users.sort((user1, user2) => {
      return user2.popularity - user1.popularity;
    });

    const responseFields = [
      "_id",
      "created",
      "name",
      "avatar",
      "userName",
      "phoneNumber",
      "popularity",
      "bankAccounts",
    ];

    var usersForReturn = [];

    users.forEach((user) => {
      const filteredUser = responseFields.reduce((obj, key) => ({ ...obj, [key]: user[key] }), {});
      usersForReturn.push(filteredUser);
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      users: usersForReturn,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetBestCreatorsController",
      error,
    });
  }
});

module.exports = router;
