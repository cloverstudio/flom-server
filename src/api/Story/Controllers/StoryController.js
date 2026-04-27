"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Product, Tribe, Category } = require("#models");

/**
 * @api {get} /api/v2/story Get story
 * @apiVersion 2.0.7
 * @apiName Get story
 * @apiGroup WebAPI Story
 * @apiDescription API for getting story (returns only marketplace products)
 *
 * @apiHeader {String} UUID UUID of the device.
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {Number} page Page number for paging
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1624535998267,
 *   "data": {
 *     "story": [
 *       {
 *         "owner": {
 *           "_id": "4751f7a544ebbc",
 *           "name": "My Name",
 *           "phoneNumber": "+2348020000000",
 *           "created": 1602151524372,
 *           "avatar": {
 *             "picture": {},
 *             "thumbnail": {},
 *           },
 *           "isAppUser": true,
 *         },
 *         "products": [
 *           "_id": "4751f7a544ebbc",
 *           "name": "Name",
 *           "type": 5,
 *           file: [
 *             {
 *               "file": {
 *                 "originalName": "group_of_spinners.jpg",
 *                 "size": 2807862,
 *                 "mimeType": "image/png",
 *                 "nameOnServer": "lAjLpx1xDQ4HPxmWrpGWcWOJxqDO4zMT"
 *               },
 *               "thumb": {
 *                 "originalName": "group_of_spinners.jpg",
 *                 "size": 95900,
 *                 "mimeType": "image/jpeg",
 *                 "nameOnServer": "0BVgbXMAw4kDl3wP4fcAmU2nYfj1EsFj"
 *               },
 *               "_id": "5f4f50f018f352279ef2a802",
 *               "order": 0,
 *               "fileType": 0
 *             }
 *           ],
 *           "tags": "#tag1 #tag2 #tag3"
 *           "numberOfLikes": 50,
 *           "itemCount": 5,
 *           "visibility": "public",
 *           "isNegotiable": true,
 *           "localPrice": {
 *             "localMin": -1,
 *             "localMax": -1,
 *             "localAmount": 5250,
 *             "amount": 13.49,
 *             "minAmount": -1,
 *             "maxAmount": -1,
 *             "currencyCode": "NGN",
 *             "currencySymbol": "₦",
 *             "currencyCountryCode": "234"
 *           },
 *           "price": 13.49,
 *           "minPrice": -1,
 *           "maxPrice": -1,
 *           "description": "description",
 *           "numberOfReviews": 1
 *         ],
 *         "productsCount": 1,
 *       },
 *     ],
 *     "page": 1,
 *     "hasNext": false,
 *   }
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
    const page = +request.query.page || 1;
    const limit = Const.newPagingRows;

    const user = request.user;

    // const token = request.headers["access-token"] || request.cookies["access-token"];
    // const user = token && (await User.findOne({ "token.token": token }));

    const usersTribes = await Tribe.find({ "members.accepted.id": user._id.toString() }).lean();
    const tribeIds = usersTribes.length > 0 ? usersTribes.map((tribe) => tribe._id.toString()) : [];

    const query = {
      type: Const.productTypeProduct,
      "moderation.status": Const.moderationStatusApproved,
      isDeleted: false,
      $or: [{ visibility: { $in: ["public", "community"] } }],
    };

    if (tribeIds.length > 0) {
      query.$or.push({ visibility: "tribes", tribeIds: { $in: tribeIds } });
    }

    if (user.kidsMode === true) {
      query.appropriateForKids = true;
    }

    const productsAggregation = await Product.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: { ownerId: "$ownerId" },
          products: {
            $push: {
              _id: "$_id",
              type: "$type",
              name: "$name",
              file: { $slice: ["$file", 1] },
              numberOfLikes: "$numberOfLikes",
              isNegotiable: "$isNegotiable",
              // localPrice: "$localPrice",
              price: "$price",
              minPrice: "$minPrice",
              maxPrice: "$maxPrice",
              originalPrice: "$originalPrice",
              description: "$description",
              numberOfReviews: "$numberOfReviews",
              communityIds: "$communityIds",
              itemCount: "$itemCount",
              visibility: "$visibility",
              tags: "$tags",
              moderation: "$moderation",
              categoryId: "$categoryId",
              parentCategoryId: "$parentCategoryId",
              location: "$location",
            },
          },
          productsCount: { $sum: 1 },
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
    ]);

    var productsGrouped = productsAggregation[0].data;
    const { total } = productsAggregation[0].metadata[0];

    const userIds = productsGrouped.reduce((acc, cur) => {
      return [...acc, cur._id.ownerId];
    }, []);

    const users = await User.find({ _id: { $in: userIds } }).lean();

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    let requestUserMembershipIds = user.memberships?.map((membership) => membership.id.toString());
    var newProductsGrouped = [];
    productsGrouped.forEach((data) => {
      var obj = {};
      obj._id = data._id;
      obj.products = [];
      obj.productsCount = data.productsCount;
      data.products.forEach((product) => {
        Utils.addUserPriceToProduct({
          product,
          userRate,
          userCountryCode,
          userCurrency,
          conversionRates,
        });

        let shouldFilterFields = true;
        product.communityIds?.forEach((id) => {
          if (requestUserMembershipIds?.includes(id)) {
            shouldFilterFields = false;
          }
        });

        const allowed = [
          "_id",
          "name",
          "numberOfReviews",
          "numberOfLikes",
          "created",
          "owner",
          "numberOfViews",
          "type",
          "communityIds",
          "visibility",
          "image",
          "file",
        ];

        if (product.communityIds?.length > 0 && shouldFilterFields) {
          product = Object.keys(product)
            .filter((key) => allowed.includes(key))
            .reduce((obj, key) => {
              if (key === "file" && product[key] != []) {
                var fileObject = {};
                var arr = [];
                product[key].map((product) => arr.push({ thumb: product.thumb }));
                fileObject = arr;

                obj[key] = fileObject;
              } else {
                obj[key] = product[key];
              }
              return obj;
            }, {});
        }
        obj.products.push(product);
        return true;
      });
      newProductsGrouped.push(obj);
    });

    productsGrouped = newProductsGrouped;

    const story = [];
    for (let i = 0; i < productsGrouped.length; i++) {
      const {
        _id: { ownerId },
        products,
        productsCount,
      } = productsGrouped[i];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        let { categoryId, parentCategoryId = null } = product;
        categoryId = !categoryId ? null : categoryId.toString();

        const categoriesArray = [];
        if (categoryId !== "-1" && categoryId !== null) categoriesArray.push(categoryId);
        if (parentCategoryId !== "-1" && parentCategoryId !== null)
          categoriesArray.push(parentCategoryId);

        const categories = await Category.find({ _id: { $in: categoriesArray } }).lean();

        categories.forEach((cat) => {
          if (cat._id.toString() === categoryId) {
            product.category = cat;
          }
          if (cat._id.toString() === parentCategoryId) {
            product.parentCategory = cat;
          }
        });

        delete product.categoryId;
        delete product.parentCategoryId;
      }

      const currentUser = users.find((user) => user._id.toString() === ownerId);
      if (currentUser) {
        story.push({
          owner: {
            _id: ownerId,
            name: currentUser.name,
            phoneNumber: currentUser.phoneNumber,
            created: currentUser.created,
            avatar: currentUser.avatar || {},
            isAppUser: currentUser.isAppUser,
            whatsApp: currentUser.whatsApp,
          },
          products,
          productsCount,
        });
      }
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      story,
      page,
      hasNext: page * limit < total ? true : false,
    });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "StoryController", error);
  }
});

module.exports = router;
