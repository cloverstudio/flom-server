"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Product } = require("#models");

/**
 * @api {get} /api/v2/users/sellers Get sellers API
 * @apiVersion 0.0.1
 * @apiName Get sellers API
 * @apiGroup WebAPI User
 * @apiDescription This API should be used to fetch the list of sellers. You can pass "search" parameter to search sellers by userName.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} search String to search userName.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1664367207016,
 *     "data": {
 *         "sellers": [
 *             {
 *                 "_id": "60e4384b560d1466637e3eca",
 *                 "bankAccounts": [
 *                     {
 *                         "_id": "6331497cc2c3314de66f8333",
 *                         "merchantCode": "40200168",
 *                         "name": "SampleAcc",
 *                         "accountNumber": "1503567574679",
 *                         "code": "",
 *                         "selected": true
 *                     }
 *                 ],
 *                 "location": {
 *                     "type": "Point",
 *                     "coordinates": [
 *                         15.984441,
 *                         45.792898
 *                     ]
 *                 },
 *                 "locationVisibility": false,
 *                 "isAppUser": true,
 *                 "name": "mer19",
 *                 "created": 1625569355699,
 *                 "phoneNumber": "+2348020000019",
 *                 "userName": "mer19",
 *                 "avatar": {
 *                     "picture": {
 *                         "originalName": "imageA_1657536411.jpg",
 *                         "size": 581830,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "Sk1PNSiLL077ycStBiKIKQLOUVfdFe7m"
 *                     },
 *                     "thumbnail": {
 *                         "originalName": "imageA_1657536411.jpg",
 *                         "size": 77900,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "XtvkndxX55h7obSauKks2oWxrzPpRb8G"
 *                     }
 *                 },
 *                 "blockedProducts": 0,
 *                 "featuredProductTypes": [],
 *                 "businessCategory": {
 *                     "_id": "5ca44ced08f8045e4e3471db",
 *                     "name": "Business services"
 *                 },
 *                 "workingHours": {
 *                     "start": "7",
 *                     "end": "15"
 *                 },
 *                 "aboutBusiness": "Ovo je nekintekst\n\nhttps://www.wikipedia.org\nJdjdjd\nKdkdkddkdk\nJdjdjdjdj\nDjjkdjdj\nJsjsjsjd\nNsnsnsn\nJdjdjdj is the one who wants it for a few weeks to see what it looks and how it is and I will be there tomorrow and I "
 *             },
 *             .
 *             .
 *             .
 *         ],
 *         "total": 15,
 *         "countResult": 10,
 *         "hasNext": true
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
    var search = request.query.search;
    const page = +request.query.page || 1;

    const sellers = await Product.aggregate([
      {
        $match: {
          type: Const.productTypeProduct,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$ownerId",
          count: {
            $sum: 1,
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    var sellersWithUserModel = await Promise.all(
      sellers.map(async (seller) => {
        const userObject = await User.findOne(
          { _id: seller._id },
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

        if (search) {
          if (userObject.userName.toLowerCase().startsWith(search.toLowerCase())) {
            return userObject;
          }
        } else {
          return userObject;
        }
      }),
    );

    sellersWithUserModel = sellersWithUserModel.filter((seller) => {
      if (seller && !seller.isDeleted.value) {
        return true;
      } else {
        false;
      }
    });

    const responseSellers = sellersWithUserModel.slice(
      (page - 1) * Const.newPagingRows,
      (page - 1) * Const.newPagingRows + 10,
    );

    const hasNext = page * Const.newPagingRows < sellersWithUserModel.length;

    Base.successResponse(response, Const.responsecodeSucceed, {
      sellers: responseSellers,
      total: sellersWithUserModel.length,
      countResult: responseSellers.length,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetAllSellersController",
      error,
    });
  }
});

module.exports = router;
