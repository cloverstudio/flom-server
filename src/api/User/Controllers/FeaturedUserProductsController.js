"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");

/**
 * @api {get} /api/v2/users/featured Get featured users
 * @apiVersion 2.0.8
 * @apiName Get featured users
 * @apiGroup WebAPI User
 * @apiDescription API for getting featured users.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [type] Filter to return featured users for one type of products. Default shows all featured users.
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "featuredUsers": [
 *       {
 *         "bankAccounts": [
 *           {
 *             "_id": "606ee80b7fd83f5ab958755c",
 *             "merchantCode": "40200168",
 *             "name": "SampleAcc",
 *             "accountNumber": "1503567574679",
 *             "code": "",
 *             "selected": true
 *           }
 *         ],
 *         "location": {
 *           "type": "Point",
 *           "coordinates": [
 *             0,
 *             0
 *           ]
 *         },
 *         "locationVisibility": false,
 *         "isAppUser": true,
 *         "name": "+2348*****0007",
 *         "created": 1602151524372,
 *         "phoneNumber": "+2348020000007",
 *         "avatar": {
 *           "picture": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 4698848,
 *             "mimeType": "image/png",
 *             "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj",
 *             "link": "https://dev.flom.app/api/v2/avatar/user/profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *           },
 *           "thumbnail": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 97900,
 *             "mimeType": "image/png",
 *             "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi",
 *             "link": "https://dev.flom.app/api/v2/avatar/user/thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *           }
 *         }
 *         "id": "5f7ee464a283bc433d9d722f",
 *         "username": "dragon2",
 *         "featuredProductTypes": [
 *           1,
 *           2
 *         ],
 *         "blockedProducts": 0,
 *       },
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443226 Invalid type parameter (has to be between 1 and 5)
 * @apiError (Errors) 4000007 Token not valid
 */

router.get(
  "/",
  auth({ allowUser: true, allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const userCountryCode = request.user.countryCode;

      const requestTypesArray = request.query.type || [];
      const typesArray = [];
      if (requestTypesArray.length) {
        for (let i = 0; i < requestTypesArray.length; i++) {
          const type = +requestTypesArray[i];
          if (Const.productTypes.indexOf(type) === -1) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeInvalidTypeParameter,
              message: `FeaturedUserProductsController - list, invalid type parameter`,
            });
          } else {
            typesArray.push(type);
          }
        }
      } else {
        typesArray.push(...Const.productTypes);
      }

      let featuredUsers = [];

      const featuredUsersFromUserCountry = await User.find(
        { "featured.types": { $in: [...new Set(typesArray)] }, countryCode: userCountryCode },
        {
          _id: 1,
          name: 1,
          phoneNumber: 1,
          avatar: 1,
          bankAccounts: 1,
          location: 1,
          locationVisibility: 1,
          aboutBusiness: 1,
          businessCategory: 1,
          workingHours: 1,
          created: 1,
          isAppUser: 1,
          userName: 1,
          featured: 1,
          blockedProducts: 1,
        },
      ).lean();

      if (featuredUsersFromUserCountry.length < 12) {
        const featuredUsersFromDefaultCountry = await User.aggregate([
          { $match: { "featured.countryCode": "default" } },
          { $sample: { size: 12 - featuredUsersFromUserCountry.length } },
        ]);

        featuredUsers.push(...featuredUsersFromDefaultCountry[0]);
      }

      featuredUsers.forEach((user) => {
        user.id = user._id.toString();
        delete user._id;
        user.username = user.userName;
        delete user.userName;
        if (!user.featured) {
          user.featured = { types: [], countryCode: "default" };
        }
        if (user.blockedProducts === undefined) {
          user.blockedProducts = 0;
        }
      });

      Base.successResponse(response, Const.responsecodeSucceed, { featuredUsers });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "FeaturedUserProductsController - list",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/users/featured Update users featured product types
 * @apiVersion 2.0.8
 * @apiName Update users featured product types
 * @apiGroup WebAPI User
 * @apiDescription API for updating users featured product types.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} userId Id of the user whose featured product types should be updated.
 * @apiParam {String} action "add" to add product type to the users featured product types. "remove" to remove product type from the users featured product types.
 * @apiParam {Number} productType Type of product that user should be featured in (1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product).
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "user": {
 *       "id": "5f7ee464a283bc433d9d722f",
 *       "phoneNumber": "+2348020000007",
 *       "username": "dragon2",
 *       "email": "m@m.com",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj",
 *           "link": "https://dev.flom.app/api/v2/avatar/user/profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi",
 *           "link": "https://dev.flom.app/api/v2/avatar/user/thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *         }
 *       }
 *       "featuredProductTypes": [
 *         1,
 *         2
 *       ],
 *       "blockedProducts": 0,
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400121 No productType parameter
 * @apiError (Errors) 443226 Invalid productType parameter (has to be between 1 and 5)
 * @apiError (Errors) 443230 Invalid userId parameter
 * @apiError (Errors) 443231 No action parameter
 * @apiError (Errors) 443232 Invalid action parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000110 No userId parameter
 * @apiError (Errors) 4000760 User with userId not found
 */

router.patch("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { userId, action, countryCode } = request.body;
    let productType = +request.body.productType;

    if (!userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoUserId,
        message: `FeaturedUserProductsController - update, no userId parameter`,
      });
    }
    if (!Utils.isValidObjectId(userId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidUserId,
        message: `FeaturedUserProductsController - update, invalid userId parameter`,
      });
    }

    /*if (countryCode === undefined) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeNoCountryCodeParameter,
            message: `FeaturedUserProductsController - no countryCode parameter`,
          });
        }

        if (!countries[countryCode] && countryCode !== "default") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCountryCode,
            message: `FeaturedUserProductsController - invalid countryCode parameter`,
          });
        }*/

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `FeaturedUserProductsController - update, user with id ${userId} not found`,
      });
    }

    if (!action) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoAction,
        message: `FeaturedUserProductsController - update, no action parameter`,
      });
    }
    if (action !== "add" && action !== "remove") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAction,
        message: `FeaturedUserProductsController - update, invalid action parameter`,
      });
    }

    if (!productType) {
      productType = user.featured?.types;
      /*return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductNoType,
            message: `FeaturedUserProductsController - update, no productType parameter`,
          });*/
    }
    if (Const.productTypes.indexOf(productType) === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTypeParameter,
        message: `FeaturedUserProductsController - update, invalid productType parameter`,
      });
    }
    const userFeaturedProductTypes = user.featured?.types || [];

    if (action === "add") {
      if (userFeaturedProductTypes.indexOf(productType) === -1) {
        userFeaturedProductTypes.push(productType);
        userFeaturedProductTypes.sort((a, b) => a - b);
        // user.featuredProductTypes = userFeaturedProductTypes;
        user.featured = {
          types: userFeaturedProductTypes,
          countryCode: countryCode || user.featured.countryCode || "default",
        };
        await user.save();
      }
    } else {
      const position = userFeaturedProductTypes.indexOf(productType);
      if (position !== -1) {
        userFeaturedProductTypes.splice(position, 1);
        // user.featuredProductTypes = userFeaturedProductTypes;
        user.featured = {
          types: userFeaturedProductTypes,
          countryCode: countryCode || user.featured.countryCode || "default",
        };
        await user.save();
      }
    }
    const userObject = user.toObject();
    Base.successResponse(response, Const.responsecodeSucceed, {
      user: {
        id: userObject._id.toString(),
        phoneNumber: userObject.phoneNumber,
        username: userObject.userName,
        email: userObject.email,
        firstName: userObject.firstName,
        lastName: userObject.lastName,
        avatar: userObject.avatar,
        featured: userObject.featured || { types: [], countryCode: "default" },
        blockedProducts: userObject.blockedProducts || 0,
      },
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FeaturedUserProductsController - update",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/users/featured Update users featured product types
 * @apiVersion 0.0.1
 * @apiName Update users featured product types
 * @apiGroup WebAPI User
 * @apiDescription API for updating users featured product types. An array of types should be sent.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} userId Id of the user whose featured product types should be updated.
 * @apiParam {Number} [productTypes] Type of products that user should be featured in (1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product).
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "user": {
 *       "id": "5f7ee464a283bc433d9d722f",
 *       "phoneNumber": "+2348020000007",
 *       "username": "dragon2",
 *       "email": "m@m.com",
 *       "firstName": "M",
 *       "lastName": "D",
 *       "avatar": {
 *         "picture": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 4698848,
 *           "mimeType": "image/png",
 *           "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj",
 *           "link": "https://dev.flom.app/api/v2/avatar/user/profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *         },
 *         "thumbnail": {
 *           "originalName": "cropped2444207444774310745.jpg",
 *           "size": 97900,
 *           "mimeType": "image/png",
 *           "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi",
 *           "link": "https://dev.flom.app/api/v2/avatar/user/thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *         }
 *       }
 *       "featuredProductTypes": [
 *         1,
 *         2
 *       ],
 *       "blockedProducts": 0,
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400121 No productType parameter
 * @apiError (Errors) 443226 Invalid productType parameter (has to be between 1 and 5)
 * @apiError (Errors) 443230 Invalid userId parameter
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000110 No userId parameter
 * @apiError (Errors) 4000760 User with userId not found
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { userId, countryCode } = request.body;
    let productTypes = request.body.productTypes;
    if (!userId) {
      return Base.newErrorResponse({
        response,

        code: Const.responsecodeNoUserId,
        message: `FeaturedUserProductsController - update(post), no userId parameter`,
      });
    }
    if (!Utils.isValidObjectId(userId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidUserId,
        message: `FeaturedUserProductsController - update(post), invalid userId parameter`,
      });
    }

    /*if (countryCode === undefined) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeNoCountryCodeParameter,
            message: `FeaturedUserProductsController - no countryCode parameter`,
          });
        }

        if (!countries[countryCode] && countryCode !== "default") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCountryCode,
            message: `FeaturedUserProductsController - invalid countryCode parameter`,
          });
        }*/

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotFound,
        message: `FeaturedUserProductsController - update(post), user with id ${userId} not found`,
      });
    }

    if (!productTypes) {
      productTypes = user.featured.types;
      /*
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductNoType,
            message: `FeaturedUserProductsController - update(post), no productTypes parameter`,
          });
          */
    }

    /*
        if (productTypes.length < 5) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTypeParameter,
            message: `FeaturedUserProductsController - update(post), productType parameter must have 5 elements]`,
          });
        }
        */

    productTypes.forEach((type) => {
      if (Const.productTypes.indexOf(type) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: `FeaturedUserProductsController - update(post), invalid productType parameter`,
        });
      }
    });

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          "featured.types": productTypes,
          ...(countryCode && { "featured.countryCode": countryCode }),
        },
      },
      { new: true },
    );

    const userObject = updatedUser.toObject();
    Base.successResponse(response, Const.responsecodeSucceed, {
      user: {
        id: updatedUser._id.toString(),
        phoneNumber: updatedUser.phoneNumber,
        username: updatedUser.userName,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        featured: updatedUser.featured || { types: [], countryCode: "default" },
        blockedProducts: updatedUser.blockedProducts || 0,
      },
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "FeaturedUserProductsController - update(post)",
      error,
    });
  }
});

module.exports = router;
