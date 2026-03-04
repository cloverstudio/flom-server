"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { ThirdPartyProduct, BlockedThirdPartyProduct } = require("#models");

/**
 * @api {get} /api/v2/admin-page/third-party-products/operators Get third-party products operators flom_v1
 * @apiVersion 2.0.22
 * @apiName  Get third-party products operators flom_v1
 * @apiGroup WebAPI Admin page - Third-party products
 * @apiDescription  Get third-party products operators. Sorted in ascending order.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String}  [provider]     Product provider. "ppn", "qrios". If not sent all providers returned.
 * @apiParam (Query string) {String}  [countryCode]  Country code. If not sent all countries returned.
 * @apiParam (Query string) {String}  [type]         Product type. "top-up", "data", "gift-card", "bill-payment". If not sent all types returned.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1720415683515,
 *     "data": {
 *         "operators": [
 *             "8ta",
 *             "AIS",
 *             "AT&T",
 *             "AWCC",
 *             "Access",
 *             "Africell ",
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "errorMessage": ErrorMessage,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443903 Invalid provider
 * @apiError (Errors) 443691 Invalid country code
 * @apiError (Errors) 443226 Invalid type
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/operators",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { provider, countryCode, type } = request.query;

      const query = {};

      if (provider && !["ppn", "qrios"].includes(provider)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProvider,
          message: "ThirdPartyProductsController, operator list - invalid provider",
        });
      }
      if (provider) {
        query.provider = provider;
      }

      if (countryCode && !countries[countryCode]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: "ThirdPartyProductsController, operator list - invalid country code",
        });
      }
      if (countryCode) {
        query.countryCode = countryCode;
      }

      if (type && !["top-up", "data", "gift-card", "bill-payment"].includes(type)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: "ThirdPartyProductsController, operator list - invalid type",
        });
      }

      if (type) {
        query.type = type;
      }

      const operators = await ThirdPartyProduct.distinct("operator", query);
      operators.sort();

      const responseData = { operators };

      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ThirdPartyProductsController, operator list",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/third-party-products Get third-party products flom_v1
 * @apiVersion 2.0.22
 * @apiName  Get third-party products flom_v1
 * @apiGroup WebAPI Admin page - Third-party products
 * @apiDescription  Get PPN products. Sorted by country code, type and operator in ascending order.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {String} [provider]    Product provider. "ppn", "qrios". "all" if looking for products from all providers.
 * @apiParam (Query string) {String} [countryCode] Country code. "all" if looking for products from all countries.
 * @apiParam (Query string) {String} [type]        Product type. "top-up", "data", "gift-card", "bill-payment". "all" if looking for products of all types.
 * @apiParam (Query string) {String} [operator]    Operator. "all" if looking for products from all operators.
 * @apiParam (Query string) {Number} [page]        Page. Default: 1
 * @apiParam (Query string) {Number} [size]        Page size. Default: 10
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1720415757581,
 *     "data": {
 *         "products": [
 *             {
 *                 "_id": "3524",
 *                 "sku": 3524,
 *                 "productName": "Amazon (15.00 - 200.00 USD)",
 *                 "exchangeRate": 1,
 *                 "countryCode": "US",
 *                 "description": "test",
 *                 "operator": "Access",
 *                 "type": "top-up",
 *                 "currencyCode": "USD",
 *                 "minAmount": 15,
 *                 "maxAmount": 200,
 *                 "logoUrl": "https://sandbox.valuetopup.com/image/index/13059"
 *             }
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "size": 1,
 *             "total": 208,
 *             "hasNext": true
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "errorMessage": ErrorMessage,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443903 Invalid provider
 * @apiError (Errors) 443691 Invalid country code
 * @apiError (Errors) 443226 Invalid type
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { provider, countryCode, type, operator, page: p, size: s } = request.query;

      const query = {};

      if (provider && !["ppn", "qrios", "all"].includes(provider)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProvider,
          message: "ThirdPartyProductsController, list - invalid provider",
        });
      }

      if (countryCode && !countries[countryCode] && countryCode !== "all") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: "ThirdPartyProductsController, list - invalid country code",
        });
      }

      if (type && !["top-up", "data", "gift-card", "bill-payment", "all"].includes(type)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: "ThirdPartyProductsController, list - invalid type",
        });
      }

      if (provider && provider !== "all") {
        query.provider = provider;
      }
      if (countryCode && countryCode !== "all") {
        query.countryCode = countryCode;
      }
      if (type && type !== "all") {
        query.type = type;
      }
      if (operator && operator !== "all") {
        query.operator = operator;
      }

      let products, paginationData;

      const page = !p ? 1 : +p;
      const size = !s ? Const.newPagingRows : +s;

      products = await ThirdPartyProduct.find(query).lean();

      const total = products.length;
      const hasNext = page * size < total;

      products = total === 0 ? [] : products.slice((page - 1) * size, (page - 1) * size + size);
      products.sort(
        (a, b) => a.countryCode - b.countryCode || a.type - b.type || a.operator - b.operator,
      );
      paginationData = { page, size, total, hasNext };

      const responseData = { products, paginationData };

      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ThirdPartyProductsController, list",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/admin-page/third-party-products/blocked Get blocked third-party products flom_v1
 * @apiVersion 2.0.22
 * @apiName  Get blocked third-party products flom_v1
 * @apiGroup WebAPI Admin page - Third-party products
 * @apiDescription  Get blocked third-party products. Sorted by creation date in descending order.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Query string) {Number} [page]  Page. Default: 1
 * @apiParam (Query string) {Number} [size]  Page size. Default: 10
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1720417005563,
 *     "data": {
 *         "blocked": [
 *             {
 *                 "_id": "668b7aacbaf29a2240fa2af4",
 *                 "created": 1720416940492,
 *                 "provider": "ppn",
 *                 "sku": 1936,
 *                 "countryCode": "US",
 *                 "operator": "Airtel",
 *                 "name": "25GB",
 *                 "type": "data"
 *                 "__v": 0
 *             }
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "size": 10,
 *             "total": 1,
 *             "hasNext": false
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "errorMessage": ErrorMessage,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/blocked",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { page: p, size: s } = request.query;

      let paginationData;

      const page = !p ? 1 : +p;
      const size = !s ? Const.newPagingRows : +s;

      let blocked = await BlockedThirdPartyProduct.find().lean();

      const total = blocked.length;
      const hasNext = page * size < total;

      blocked = total === 0 ? [] : blocked.slice((page - 1) * size, (page - 1) * size + size);
      blocked.sort((a, b) => b.created - a.created);
      paginationData = { page, size, total, hasNext };

      const responseData = { blocked, paginationData };

      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ThirdPartyProductsController, blocked list",
        error,
      });
    }
  },
);

/**
 * @api {post} /api/v2/admin-page/third-party-products/block Block third-party products flom_v1
 * @apiVersion 2.0.22
 * @apiName  Block third-party products flom_v1
 * @apiGroup WebAPI Admin page - Third-party products
 * @apiDescription  API blocks a third-party product by product id or a range of products by provider, country code, type, operator.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam (Request body (block product id)) {String[]} productIds  Array of productIds to block
 *
 * @apiParam (Request body (block range)) {String} provider    Product provider. "ppn" or "qrios"
 * @apiParam (Request body (block range)) {String} countryCode Country code. "all" if products from all countries.
 * @apiParam (Request body (block range)) {String} type        Product type. "top-up", "data", "gift-card", "bill-payment". "all" if products of all types.
 * @apiParam (Request body (block range)) {String} operator    Operator. "all" if products from all operators.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1720415984884,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "errorMessage": ErrorMessage,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443903 Invalid provider
 * @apiError (Errors) 443904 Invalid ids array
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 443907 Block already exists
 * @apiError (Errors) 443691 Invalid country code
 * @apiError (Errors) 443226 Invalid type
 * @apiError (Errors) 443905 Invalid operator
 * @apiError (Errors) 4000007 Token invalid
 */

router.post(
  "/block",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { provider, countryCode, type, operator, productIds } = request.body;

      if (productIds) {
        if (!Array.isArray(productIds)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidIdsArray,
            message: "ThirdPartyProductsController, block - invalid productIds array",
          });
        }

        const newBans = [];

        for (const id of productIds) {
          const product = await ThirdPartyProduct.findById(id).lean();

          if (!product) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeProductNotFound,
              message: `ThirdPartyProductsController, block - product with id ${id} not found`,
            });
          }

          const block = await BlockedThirdPartyProduct.findOne({ productId: id }).lean();

          if (block) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeBlockAlreadyExists,
              message: `ThirdPartyProductsController, block - block for productId ${id} already exists`,
            });
          }

          newBans.push({
            productId: id,
            provider: product.provider,
            sku: product.sku,
            countryCode: product.countryCode,
            type: product.type,
            operator: product.operator,
            name: product.name,
          });
        }

        await BlockedThirdPartyProduct.create(newBans);

        return Base.successResponse(response, Const.responsecodeSucceed);
      }

      if (!provider || !["ppn", "qrios"].includes(provider)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProvider,
          message: "ThirdPartyProductsController, block - invalid provider",
        });
      }
      if (!countryCode || (!countries[countryCode] && countryCode !== "all")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCountryCode,
          message: "ThirdPartyProductsController, block - invalid country code",
        });
      }
      if (!type || !["top-up", "data", "gift-card", "bill-payment", "all"].includes(type)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: "ThirdPartyProductsController, block - invalid type",
        });
      }
      if (!operator) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidOperator,
          message: "ThirdPartyProductsController, block - invalid operator",
        });
      }

      const exists = await BlockedThirdPartyProduct.findOne({
        provider,
        countryCode,
        type,
        operator,
      }).lean();

      if (exists) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeBlockAlreadyExists,
          message: `ThirdPartyProductsController, block - block for ${JSON.stringify({
            provider,
            countryCode,
            type,
            operator,
          })} already exists`,
        });
      }

      await BlockedThirdPartyProduct.create({ provider, countryCode, type, operator });

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ThirdPartyProductsController, block",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/third-party-products/unblock/:blockId Unblock third-party products flom_v1
 * @apiVersion 2.0.22
 * @apiName  Unblock third-party products flom_v1
 * @apiGroup WebAPI Admin page - Third-party products
 * @apiDescription  API Unblock a third-party product sku or range.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1720415984884,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "errorMessage": ErrorMessage,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443906 Invalid block ID
 * @apiError (Errors) 443908 Block not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete(
  "/unblock/:blockId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const { blockId } = request.params;

      if (!blockId || !Utils.isValidObjectId(blockId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidId,
          message: "ThirdPartyProductsController, unblock - invalid blockId",
        });
      }

      const block = await BlockedThirdPartyProduct.findById(blockId).lean();

      if (!block) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeBlockNotFound,
          message: "ThirdPartyProductsController, unblock - block not found",
        });
      }

      await BlockedThirdPartyProduct.deleteOne({ _id: blockId });

      Base.successResponse(response, Const.responsecodeSucceed);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "ThirdPartyProductsController, unblock",
        error,
      });
    }
  },
);

module.exports = router;
