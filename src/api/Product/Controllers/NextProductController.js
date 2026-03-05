"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, Category, User, Tribe, View } = require("#models");

/**
 * @api {post} /api/v2/products/next Fetch next product
 * @apiVersion 2.0.9
 * @apiName Fetch next product
 * @apiGroup WebAPI Products
 * @apiDescription API for getting next product (video, video story, podcast and text story). Next product will be of same type as the first product
 * from the given productIds. You can't get a product that you are owner of.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productIds List of product ids separated by a comma (e.g. "61203ed448c6c40f4dffb002,61203ed448c6c40f4dffb004")
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635333004207,
 *   "data": {
 *     "product": {
 *       "_id": "61203ed448c6c40f4dffb003",
 *       "price": -1,
 *       "created": 1629503188127,
 *       "file": [
 *         {
 *           "file": {
 *             "originalName": "2021-08-20-18-43-19-325.mp4",
 *             "nameOnServer": "otlu9XZP72NWKGSH7BcjwwdcH5LSOjv0",
 *             "aspectRatio": 0.66668,
 *             "duration": 5.467002,
 *             "mimeType": "video/mp4",
 *             "size": 2458780,
 *             "hslName": "Q7dCQYra56j8Cvr40jO2HEWw6vxlGYXr"
 *           },
 *           "thumb": {
 *             "originalName": "2021-08-20-18-43-19-325.mp4",
 *             "nameOnServer": "XWnuVRsIUcZK6K080rSMPitmzDWvstvW",
 *             "mimeType": "image/png",
 *             "size": 104976
 *           },
 *           "_id": "61203ed448c6c40f4dffb004",
 *           "fileType": 1,
 *           "order": 0
 *         }
 *       ],
 *       "image": [],
 *       "location": {
 *         "coordinates": [
 *           0,
 *           0
 *         ],
 *         "type": "Point"
 *       },
 *       "minPrice": -1,
 *       "maxPrice": -1,
 *       "localPrice": {
 *         "localMin": -1,
 *         "localMax": -1,
 *         "localAmount": -1,
 *         "amount": -1,
 *         "minAmount": -1,
 *         "maxAmount": -1
 *       },
 *       "numberOfLikes": 1,
 *       "moderation": {
 *         "status": 3,
 *         "comment": null
 *       },
 *       "name": "Shaky Mac ",
 *       "description": "",
 *       "type": 2,
 *       "ownerId": "5fd0c8043796fc0fdbe5b5b5",
 *       "parentCategoryId": "-1",
 *       "categoryId": "5bd98d220bb237660b061159",
 *       "numberOfViews": 11,
 *       "owner": {
 *         "_id": "5fd0c8043796fc0fdbe5b5b5",
 *         "username": "moshantigua",
 *         "name": "moshantigua",
 *         "bankAccounts": [],
 *         "phoneNumber": "+12687147071",
 *         "created": 1607518212651,
 *         "avatar": {},
 *         "isAppUser": true
 *       },
 *       "category": {
 *         "_id": "5bd98d220bb237660b061159",
 *         "name": "Default",
 *         "__v": 0,
 *         "parentId": "-1",
 *         "group": [
 *           1
 *         ]
 *       }
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
 * @apiError (Errors) 400160 No next product found
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", async function (request, response) {
  try {
    const { productIds } = request.body;
    const accessToken = request.headers["access-token"];
    const matchQuery = {
      "moderation.status": Const.moderationStatusApproved,
      appropriateForKids: true,
    };

    if (request.headers["access-token"]) {
      const requestUser = await User.findOne(
        { "token.token": request.headers["access-token"] },
        { _id: 1 },
      ).lean();

      if (requestUser) {
        matchQuery.ownerId = { $ne: requestUser._id.toString() };
        if (requestUser.kidsMode === false) matchQuery.appropriateForKids = false;
      }
    }

    if (productIds) {
      const productIdsArray = productIds.split(",");
      const productIdsFiltered = productIdsArray.reduce((acc, productId) => {
        if (Utils.isValidObjectId(productId)) {
          acc.push(productId);
        }
        return acc;
      }, []);

      if (productIdsFiltered.length) {
        matchQuery["_id"] = { $nin: productIdsFiltered };

        matchQuery["isDeleted"] = false;

        let i = 0;
        do {
          const product = await Product.findOne(
            { _id: productIdsFiltered[i++], isDeleted: false },
            { type: 1 },
          ).lean();
          if (product) {
            matchQuery["type"] = product.type;
          }
        } while (matchQuery.type === undefined || i < productIdsFiltered.length);
      }
    }

    let query = [];

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (accessToken) {
      const user = await User.findOne({ "token.token": accessToken }).lean();
      if (!user) return Base.successResponse(response, Const.responsecodeSigninInvalidToken);

      if (user.blocked && user.blocked.length > 0) {
        if (!matchQuery.ownerId) matchQuery.ownerId = {};
        matchQuery.ownerId.$nin = user.blocked;
      }

      let userTribeIdsArray = await Tribe.aggregate([
        {
          $match: {
            $or: [{ ownerId: user._id.toString() }, { "members.accepted.id": user._id.toString() }],
          },
        },
        { $project: { _id: 1 } },
      ]);
      userTribeIdsArray = userTribeIdsArray.map((element) => {
        return element._id;
      });

      if (!userTribeIdsArray || userTribeIdsArray.length === 0)
        query.push({ visibility: "public" });
      else query.push({ visibility: "public" }, { tribeIds: { $in: userTribeIdsArray } });
    } else {
      query.push({ visibility: "public" });
    }

    matchQuery["$or"] = query;

    const products = await Product.aggregate([{ $match: matchQuery }, { $sample: { size: 1 } }]);

    const filteredProducts = products.filter(
      (product) => !productIds.includes(product._id.toString()),
    );

    if (!filteredProducts.length) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductNotFound,
        message: `NextProductController, no next product found`,
      });
    }

    const { __v, ...productObj } = filteredProducts[0];

    const owner = await User.findOne({ _id: productObj.ownerId }).lean();
    if (owner) {
      productObj.owner = {
        _id: owner._id.toString(),
        username: owner.userName,
        phoneNumber: owner.phoneNumber,
        name: owner.name,
        bankAccounts: owner.bankAccounts,
        created: owner.created,
        avatar: owner.avatar || {},
        isAppUser: owner.isAppUser,
      };
    }

    const category = await Category.findOne({ _id: productObj.categoryId }).lean();
    productObj.category = category;

    if (productObj.parentCategoryId !== "-1") {
      const parentCategory = await Category.findOne({ _id: productObj.parentCategoryId }).lean();
      productObj.parentCategory = parentCategory;
    }

    Utils.addUserPriceToProduct({
      product: productObj,
      userRate,
      userCountryCode,
      userCurrency,
      conversionRates,
    });

    if (accessToken) {
      const user = await User.findOne({ "token.token": accessToken }).lean();

      if (user) {
        const view = await View.create({
          productId: productObj._id,
          userId: user._id,
          productType: productObj.type,
        });
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      product: productObj,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "NextProductController",
      error,
    });
  }
});

module.exports = router;
