"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Review, User } = require("#models");

/**
 * @api {get} /api/v2/users/community Users community content
 * @apiVersion 2.0.8
 * @apiName Users community content
 * @apiGroup WebAPI User
 * @apiDescription Returns users community content (products that have comments on them). The list is sorted so the product with newest comments is first
 *
 * @apiParam (Query string) {String} [search] Search term to find in either product name or description
 * @apiParam (Query string) {String} [userId] UserId of the user for which to get the community content (used when looking at other user profile page)
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [itemsPerPage] Number of items per page for paging (default 10)
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1632913972902,
 *   "data": {
 *     "products": [
 *       {
 *         "_id": "60fec00f153aafca439c2ffb",
 *         "created": 1627308047512,
 *         "type": 1,
 *         "file": [
 *           {
 *             "file": {
 *               "originalName": "mixkit-waves-in-the-water-1164.mp4",
 *               "nameOnServer": "hVB167VCKGOTvaVXVBaacpwTIMHqivGb",
 *               "aspectRatio": 0.56251,
 *               "duration": 20.562218,
 *               "mimeType": "video/mp4",
 *               "size": 71891081,
 *               "hslName": "QnXcMrCwfoKS6zhTqapdZz6t6ZneXmUL"
 *             },
 *             "thumb": {
 *               "originalName": "mixkit-waves-in-the-water-1164.mp4",
 *               "nameOnServer": "sUDSMrO5RB8R1UoIqULPXKPbEOradisU",
 *               "mimeType": "image/png",
 *               "size": 280239
 *             },
 *             "_id": "60fec00f153aafca439c2ffc",
 *             "order": 0,
 *             "fileType": 1
 *           }
 *         ],
 *         "name": "This is the greates short video you will EVER see!",
 *         "numberOfViews": 11,
 *         "latestReview": {
 *           "userId": "6008f4f52639cf0b1829dd49",
 *           "comment": "Video comment new person!",
 *           "files": [...], //same as file array on products
 *           "rate": 5,
 *           "created": 1632907168397,
 *           "name": "Quality assurance"
 *         }
 *       },
 *       {
 *         "_id": "6103c4cd42fc9813e7110ef7",
 *         "created": 1632907024147,
 *         "type": 1,
 *         "file": [
 *           {
 *             "file": {
 *               "originalName": "605542a6e3efb245707d8d74.MOV",
 *               "nameOnServer": "2FlsHgp8KLcT6NYMZEebs7FmY0sKVCwQ",
 *               "aspectRatio": 1.81819,
 *               "duration": 417.401898,
 *               "mimeType": "video/quicktime",
 *               "size": 39746314,
 *               "hslName": "5TroXQEoGTnG91rfbXrjJZSie5Zz1MXh"
 *             },
 *             "thumb": {
 *               "originalName": "605542a6e3efb245707d8d74.MOV",
 *               "nameOnServer": "5XjDM8rGXnupHS7SOWdcAoRe11Ksjxfr",
 *               "mimeType": "image/png",
 *               "size": 66327
 *             },
 *             "_id": "6103c4cd42fc9813e7110ef8",
 *             "fileType": 1,
 *             "order": 0
 *           }
 *         ],
 *         "name": "Video 2",
 *         "numberOfViews": 40,
 *         "latestReview": {
 *           "userId": "6008f4f52639cf0b1829dd49",
 *           "comment": "Video comment doesn't have rate.",
 *           "files": [...],
 *           "created": 1632907028147,
 *           "name": "Quality assurance"
 *         }
 *       }
 *     ],
 *     "total": 2,
 *     "page": 1
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.query.userId || request.user._id.toString();
    const search = request.query.search?.toString();
    const page = +request.query.page || 1;
    const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

    if (!Utils.isValidObjectId(userId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserIdNotValid,
        message: "UsersCommunityContent error, userId not a valid Id",
      });
    }

    if (request.query.userId.toString().length) {
      const user = await User.findOne({
        _id: request.query.userId,
      }).lean();
      if (!user) {
        return Base.successResponse(response, Const.responsecodeUserNotFound);
      }

      if (user?.isDeleted.value) {
        return Base.successResponse(response, Const.responsecodeUserDeleted);
      }
    }

    const searchQuery = { ownerId: userId };
    searchQuery.isDeleted = false;
    const sort = {};

    if (search && search !== "") {
      searchQuery["$or"] = [
        { name: { $regex: new RegExp(search.toString()), $options: "i" } },
        { description: { $regex: new RegExp(search.toString()), $options: "i" } },
      ];
    }

    const usersProducts = await Product.find(searchQuery, {
      type: 1,
      file: 1,
      name: 1,
      created: 1,
      numberOfViews: 1,
      metaScore: { $meta: "textScore" },
    })
      .sort(sort)
      .lean();

    const productIds = [];
    const productsAsObject = {};
    usersProducts.forEach((product) => {
      const productId = product._id.toString();
      productIds.push(productId);
      productsAsObject[productId] = product;
    });

    const productCommentsGrouped = await Review.aggregate([
      {
        $match: { product_id: { $in: productIds }, isDeleted: false },
      },
      {
        $group: {
          _id: "$product_id",
          reviews: {
            $push: {
              userId: "$user_id",
              comment: "$comment",
              rate: "$rate",
              files: "$files",
              created: "$created",
            },
          },
        },
      },
      { $addFields: { productId: "$_id" } },
      { $sort: { "reviews.created": -1 } },
    ]);

    const productsWithLatestComment = productCommentsGrouped.map((group) => {
      const reviewsSorted = group.reviews.sort((a, b) => b.created - a.created);
      return {
        ...productsAsObject[group.productId.toString()],
        latestReview: reviewsSorted[0],
      };
    });

    const productsSorted = productsWithLatestComment.sort(
      (a, b) => b.latestReview.created - a.latestReview.created,
    );

    const allReviewUsers = new Set();
    productsSorted.forEach((product) => {
      delete product.metaScore;
      allReviewUsers.add(product.latestReview.userId);
    });

    const allReviewUsersFromDb = await User.find(
      { _id: { $in: [...allReviewUsers] } },
      { name: 1 },
    ).lean();

    const allReviewerUsersObj = {};
    allReviewUsersFromDb.forEach((user) => (allReviewerUsersObj[user._id.toString()] = user.name));

    productsSorted.forEach(
      (product) => (product.latestReview.name = allReviewerUsersObj[product.latestReview.userId]),
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      products: productsSorted.slice((page - 1) * itemsPerPage, page * itemsPerPage),
      total: productsSorted.length,
      itemsPerPage,
    });
  } catch (error) {
    console.log("UsersCommunityContent error, ", error);
    return Base.errorResponse(response, Const.httpCodeServerError);
  }
});

module.exports = router;
