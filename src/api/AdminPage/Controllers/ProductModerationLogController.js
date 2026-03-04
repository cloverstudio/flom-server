"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, ProductModerationLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/product-moderation-logs Admin page product moderation logs list
 * @apiVersion 2.0.10
 * @apiName Admin page product moderation logs list
 * @apiGroup WebAPI Admin page
 * @apiDescription API used for getting the list of product moderation logs. Admin role needed for access.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) [productName] Name of the product to
 * @apiParam (Query string) [productType] Type of the product (1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product)
 * @apiParam (Query string) [productId] Id of the product. ProductName is ignored if productId is given
 * @apiParam (Query string) [adminUsername] Username of the admin page user
 * @apiParam (Query string) [page] Page number. Default 1
 * @apiParam (Query string) [itemsPerPage] Number of results per page. Default 10
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639659646918,
 *   "data": {
 *     "productModerationLogs": [
 *       {
 *         "id": "61bb36fa0c7926e3a88af114",
 *         "created": 1639659258081,
 *         "productId": "61a79a2512042d28af4def8f",
 *         "productName": "guhju",
 *         "productType": 4,
 *         "oldProductStatus": 1,
 *         "newProductStatus": 2,
 *         "newProductComment": "NO!",
 *         "adminUserId": "6103c68fd649dd136f5fc8fa",
 *         "adminUsername": "mdragic"
 *       }
 *     ],
 *     "pagination": {
 *       "total": 1,
 *       "itemsPerPage": 10
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 443225 Invalid productId parameter
 * @apiError (Errors) 443226 Invalid type parameter (has to be between 1 and 5)
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { productName, productId, adminUsername } = request.query;
    const productType = +request.query.productType;
    const page = +request.query.page || 1;
    const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

    const searchQuery = {};

    if (productId) {
      if (!Utils.isValidObjectId(productId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProductId,
          message: `ProductModerationLogController, productId is not valid`,
        });
      }
      const product = await Product.findOne({ _id: productId }, { _id: 1 }).lean();
      if (!product) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNotFound,
          message: `ProductModerationLogController, product not found`,
        });
      }
      searchQuery.productId = productId;
    } else if (productName) {
      searchQuery.productName = { $regex: new RegExp(productName.toString()), $options: "i" };
    }

    if (adminUsername) {
      searchQuery.adminUsername = adminUsername;
    }

    if (productType) {
      if (Const.productTypes.indexOf(productType) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: `ProductModerationLogController, wrong productType parameter`,
        });
      }
      searchQuery.productType = productType;
    }

    const productModerationLogs = await ProductModerationLog.find(searchQuery)
      .limit(itemsPerPage)
      .skip((page - 1) * itemsPerPage)
      .sort({ created: -1 })
      .lean();

    const productModerationLogsFormatted = productModerationLogs.map((log) => {
      const { _id: id, __v, ...rest } = log;
      return { id, ...rest };
    });

    const total = await ProductModerationLog.countDocuments(searchQuery);

    Base.successResponse(response, Const.responsecodeSucceed, {
      productModerationLogs: productModerationLogsFormatted,
      pagination: { total, itemsPerPage },
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ProductModerationLogController",
      error,
    });
  }
});

module.exports = router;
