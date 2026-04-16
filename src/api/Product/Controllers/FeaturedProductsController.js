"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product } = require("#models");

/**
 * @api {post} /api/v2/product/featured/:productId Feature product API
 * @apiVersion 0.0.1
 * @apiName Feature product API
 * @apiGroup WebAPI Products
 * @apiDescription API for featuring products. A maximum of 4 products could be featured. When a new product is to be featured, the oldest one(field featured.created) must be unfeatured.
 *
 * @apiParam {String} countryCode Country code
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 *  @apiSuccessExample {json} Success Response
 *  {
 *   "code": 1,
 *   "time": 1657007766401,
 *   "data": {
 *      "product": {
 *          "price": -1,
 *          "created": 1631932094501,
 *          "modified": 1631932094501,
 *          "file": [
 *              {
 *                  "file": {
 *                      "originalName": "2021-09-17-21-26-59-724.mp4",
 *                      "nameOnServer": "6L48qgIcbR064NZB3aDt7Oqaoa3Bn6Q4",
 *                      "aspectRatio": 0.66668,
 *                      "duration": 3.47101,
 *                      "mimeType": "video/mp4",
 *                      "size": 1461909,
 *                      "hslName": "MT7GebvuFNVWjQaQ0BpqgAhDEcjrrBJm"
 *                  },
 *                  "thumb": {
 *                      "originalName": "2021-09-17-21-26-59-724.mp4",
 *                      "nameOnServer": "gJcpdiaCmR3nooMkIDL3YZaegYjmatrq",
 *                      "mimeType": "image/png",
 *                      "size": 47180
 *                  },
 *                  "_id": "61454ebe34b81213a5080abe",
 *                  "fileType": 1,
 *                  "order": 0
 *              }
 *          ],
 *          "image": [],
 *          "location": {
 *              "coordinates": [
 *                  0,
 *                  0
 *              ],
 *              "type": "Point"
 *          },
 *          "minPrice": -1,
 *          "maxPrice": -1,
 *          "localPrice": {
 *              "localMin": -1,
 *              "localMax": -1,
 *              "localAmount": -1,
 *              "amount": -1,
 *              "minAmount": -1,
 *              "maxAmount": -1
 *          },
 *          "numberOfLikes": 2,
 *          "moderation": {
 *              "status": 3,
 *              "comment": null
 *          },
 *          "hashtags": [],
 *          "visibility": "public",
 *          "tribeIds": [],
 *          "communityIds": [],
 *          "featured": {
 *              "created": "2022-07-05T07:56:06.357Z",
 *              "isFeatured": true
 *          },
 *          "_id": "61454ebe34b81213a5080abd",
 *          "name": "its dark😝🐃",
 *          "description": "",
 *          "type": 2,
 *          "ownerId": "5fd0c8043796fc0fdbe5b5b5",
 *          "categoryId": "5bd98d220bb237660b061159",
 *          "__v": 1,
 *          "numberOfViews": 41,
 *          "parentCategoryId": "-1"
 *      }
 *    }
 * }
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 400160 productId not valid
 */

router.post(
  "/:productId",
  auth({ allowAdmin: true, role: Const.Role.REVIEWER }),
  async function (request, response) {
    try {
      let productId = request.params.productId;
      let countryCode = request.body.countryCode;
      //const featuredProductsDefaultQuantity = 12;

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

      const product = await Product.findOne({ _id: productId, isDeleted: false }).lean();

      if (!product) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNotFound,
          message: `FeaturedProductsController, product not found`,
        });
      }

      /*if (product.featured?.isFeatured) {   
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductAlreadyFeatured,
            message: `FeaturedProductsController, product already featured`,
          });
        }*/

      // const featuredProducts = await Product
      //   .find({ "featured.isFeatured": 1 })
      //   .sort({ "featured.created": 1 })
      //   .lean();

      var updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id.toString() },
        {
          $set: {
            "featured.isFeatured": 1,
            "featured.created": Date.now(),
            ...(countryCode && { "featured.countryCode": countryCode }),
          },
        },
        { new: true },
      ).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        product: updatedProduct,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "FeaturedProductsController",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/product/featured/:productId Unfeature product API
 * @apiVersion 0.0.1
 * @apiName Unfeature product API
 * @apiGroup WebAPI Products
 * @apiDescription API for unfeaturing products.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 *  @apiSuccessExample {json} Success Response
 *  {
 *   "code": 1,
 *   "time": 1657007766401,
 *   "data": {
 *      "product": {
 *          "price": -1,
 *          "created": 1631932094501,
 *          "modified": 1631932094501,
 *          "file": [
 *              {
 *                  "file": {
 *                      "originalName": "2021-09-17-21-26-59-724.mp4",
 *                      "nameOnServer": "6L48qgIcbR064NZB3aDt7Oqaoa3Bn6Q4",
 *                      "aspectRatio": 0.66668,
 *                      "duration": 3.47101,
 *                      "mimeType": "video/mp4",
 *                      "size": 1461909,
 *                      "hslName": "MT7GebvuFNVWjQaQ0BpqgAhDEcjrrBJm"
 *                  },
 *                  "thumb": {
 *                      "originalName": "2021-09-17-21-26-59-724.mp4",
 *                      "nameOnServer": "gJcpdiaCmR3nooMkIDL3YZaegYjmatrq",
 *                      "mimeType": "image/png",
 *                      "size": 47180
 *                  },
 *                  "_id": "61454ebe34b81213a5080abe",
 *                  "fileType": 1,
 *                  "order": 0
 *              }
 *          ],
 *          "image": [],
 *          "location": {
 *              "coordinates": [
 *                  0,
 *                  0
 *              ],
 *              "type": "Point"
 *          },
 *          "minPrice": -1,
 *          "maxPrice": -1,
 *          "localPrice": {
 *              "localMin": -1,
 *              "localMax": -1,
 *              "localAmount": -1,
 *              "amount": -1,
 *              "minAmount": -1,
 *              "maxAmount": -1
 *          },
 *          "numberOfLikes": 2,
 *          "moderation": {
 *              "status": 3,
 *              "comment": null
 *          },
 *          "hashtags": [],
 *          "visibility": "public",
 *          "tribeIds": [],
 *          "communityIds": [],
 *          "featured": {
 *              "created": "2022-07-05T07:56:06.357Z",
 *              "isFeatured": false
 *          },
 *          "_id": "61454ebe34b81213a5080abd",
 *          "name": "its dark😝🐃",
 *          "description": "",
 *          "type": 2,
 *          "ownerId": "5fd0c8043796fc0fdbe5b5b5",
 *          "categoryId": "5bd98d220bb237660b061159",
 *          "__v": 1,
 *          "numberOfViews": 41,
 *          "parentCategoryId": "-1"
 *      }
 *    }
 * }
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 400160 productId not valid
 */

router.delete(
  "/:productId",
  auth({ allowAdmin: true, role: Const.Role.REVIEWER }),
  async function (request, response) {
    try {
      let productId = request.params.productId;

      const product = await Product.findOne({ _id: productId }).lean();

      if (!product) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNotFound,
          message: `FeaturedProductsController, product not found`,
        });
      }

      if (!product.featured?.isFeatured) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductIsNotFeatured,
          message: `FeaturedProductsController, product is not featured`,
        });
      }

      var featuredProduct = await Product.findOneAndUpdate(
        { _id: product._id.toString() },
        {
          $set: {
            "featured.isFeatured": 0,
          },
        },
        { new: true },
      ).lean();

      Base.successResponse(response, Const.responsecodeSucceed, {
        product: featuredProduct,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "FeaturedProductsController",
        error,
      });
    }
  },
);

module.exports = router;
