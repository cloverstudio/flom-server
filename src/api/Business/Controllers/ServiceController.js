"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries, businessTags } = require("#config");
const { auth, autoApproveProduct } = require("#middleware");
const Utils = require("#utils");
const Logics = require("#logics");
const { Business, Product, ServiceCandidate } = require("#models");

/**
 * @api {get} /api/v2/businesses/:businessId/services  Get service list flom_v1
 * @apiVersion 2.0.34
 * @apiName Get service list
 * @apiGroup WebAPI Business - Service
 * @apiDescription Get a list of services for a business.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "services": [
 * 				    {
 *               "_id": "6a569f265deda20265771cda",
 *               "name": "šišanje",
 *               "description": "brbrbrbrrrrr",
 *               "originalPrice": {
 *                   "countryCode": "HR",
 *                   "currency": "EUR",
 *                   "value": 100,
 *                   "minValue": -1,
 *                   "maxValue": -1,
 *                   "singleValue": -1,
 *                   "unlimitedValue": -1,
 *                   "exclusiveValue": -1
 *               },
 *               "isDeleted": false,
 *               "numberOfReviews": 0,
 *               "numberOfViews": 0,
 *               "numberOfLikes": 0,
 *               "moderation": {
 *                   "status": 1
 *               },
 *               "type": 6,
 *               "hashtags": [],
 *               "appropriateForKids": false,
 *               "visibility": "public",
 *               "tribeIds": [],
 *               "communityIds": [],
 *               "featured": {
 *                   "isFeatured": false,
 *                   "countryCode": "default",
 *                   "created": 1784061734995
 *               },
 *               "allowPublicComments": false,
 *               "availableForExpo": false,
 *               "usedInExpoCount": 0,
 *               "oldSlugs": [],
 *               "businessId": "6a561fa0fd66633a96932d37",
 *               "created": 1784061734995,
 *               "modified": 1784061734995,
 *               "file": [],
 *               "image": [],
 *               "audiosForExpo": [],
 *               "contentPurchaseHistory": [],
 *               "reservations": [],
 *               "createdAt": "2026-07-14T20:42:14.997Z",
 *               "updatedAt": "2026-07-14T20:42:14.997Z",
 *               "__v": 0
 *            }
 * 		  	]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:businessId/services", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId } = request.params;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "ServiceController, get service list - invalid businessId",
      });
    }

    const services = await Product.find({
      businessId,
      isDeleted: false,
      type: Const.productTypeService,
    }).lean();

    Base.successResponse(response, Const.responsecodeSucceed, { services });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "ServiceController, get service",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/services/suggested  Get suggested services flom_v1
 * @apiVersion 2.0.34
 * @apiName Get suggested services
 * @apiGroup WebAPI Business - Service
 * @apiDescription Get a list of suggested services. Returns empty array if there are no services for a tag.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String}  tagIds     Business tag ids for which suggested services should be returned, separated with comma (eg. tag1,tag2,tag3)
 * @apiParam (Query string) {String}  [market]   Market code to filter suggested services (country code - HR, NG, US)
 * @apiParam (Query string) {String}  [keyword]  Keyword to search tags (1 character - finds those starting with the character, 2 or more characters - finds those containing the keyword)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1786672795595,
 *     "data": {
 *         "suggestedServices": [
 *             {
 *                 "tagId": "tag_plumbing",
 *                 "suggestedServiceId": "si_leaking_tap_repair",
 *                 "display": {
 *                     "en-NG": "Leaking tap repair",
 *                     "default": "Leaking tap repair"
 *                 }
 *             },
 *             {
 *                 "tagId": "tag_plumbing",
 *                 "suggestedServiceId": "si_burst_pipe_repair",
 *                 "display": {
 *                     "en-NG": "Burst pipe repair",
 *                     "default": "Burst pipe repair"
 *                 }
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443979 Tag is not available on the market
 * @apiError (Errors) 443980 Invalid tag
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/services/suggested", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { keyword, market } = request.query;
    const tagIdsString = request.query.tagIds || "";
    const tagIds = tagIdsString
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (tagIds.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTag,
        message: "ServiceController, get suggested services - invalid tagId",
      });
    }

    const suggestedServices = [];

    tagIds.forEach((tagId) => {
      const tag = businessTags.find((t) => t.id === tagId);

      if (!tag) {
        return;
      }

      if (!tag.suggestedItems || tag.suggestedItems.length === 0) {
        return;
      }

      if (market && tag.markets && !tag.markets.includes(market)) {
        return;
      }

      let tagSuggestedServices = tag.suggestedItems;

      if (keyword && keyword.length > 0) {
        tagSuggestedServices = tagSuggestedServices.filter((s) => {
          const displayName = s.display["en-NG"] || s.display.default || "";

          if (keyword.length === 1) {
            return displayName.toLowerCase().startsWith(keyword.toLowerCase());
          } else {
            return displayName.toLowerCase().includes(keyword.toLowerCase());
          }
        });
      }

      tagSuggestedServices = tagSuggestedServices.map((s) => ({
        tagId,
        suggestedServiceId: s.id,
        display: s.display,
      }));

      suggestedServices.push(...tagSuggestedServices);
    });

    Base.successResponse(response, Const.responsecodeSucceed, { suggestedServices });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "ServiceController, get suggested services",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/services/:serviceId  Get service flom_v1
 * @apiVersion 2.0.34
 * @apiName Get service
 * @apiGroup WebAPI Business - Service
 * @apiDescription Get an existing service.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "service": {
 *             "_id": "6a569f265deda20265771cda",
 *             "name": "šišanje",
 *             "description": "brbrbrbrrrrr",
 *             "originalPrice": {
 *                 "countryCode": "HR",
 *                 "currency": "EUR",
 *                 "value": 100,
 *                 "minValue": -1,
 *                 "maxValue": -1,
 *                 "singleValue": -1,
 *                 "unlimitedValue": -1,
 *                 "exclusiveValue": -1
 *             },
 *             "isDeleted": false,
 *             "numberOfReviews": 0,
 *             "numberOfViews": 0,
 *             "numberOfLikes": 0,
 *             "moderation": {
 *                 "status": 1
 *             },
 *             "type": 6,
 *             "hashtags": [],
 *             "appropriateForKids": false,
 *             "visibility": "public",
 *             "tribeIds": [],
 *             "communityIds": [],
 *             "featured": {
 *                 "isFeatured": false,
 *                 "countryCode": "default",
 *                 "created": 1784061734995
 *             },
 *             "allowPublicComments": false,
 *             "availableForExpo": false,
 *             "usedInExpoCount": 0,
 *             "oldSlugs": [],
 *             "businessId": "6a561fa0fd66633a96932d37",
 *             "created": 1784061734995,
 *             "modified": 1784061734995,
 *             "file": [],
 *             "image": [],
 *             "audiosForExpo": [],
 *             "contentPurchaseHistory": [],
 *             "reservations": [],
 *             "createdAt": "2026-07-14T20:42:14.997Z",
 *             "updatedAt": "2026-07-14T20:42:14.997Z",
 *             "__v": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443988 Invalid service id
 * @apiError (Errors) 443989 Service not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/services/:serviceId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { serviceId } = request.params;

    if (!serviceId || !Utils.isValidObjectId(serviceId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidServiceId,
        message: "ServiceController, get service - invalid serviceId",
      });
    }

    const service = await Product.findById(serviceId).lean();

    if (!service || service.isDeleted) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeServiceNotFound,
        message: "ServiceController, get service - service not found",
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, { service });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "ServiceController, get service",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/businesses/services  Add service flom_v1
 * @apiVersion 2.0.34
 * @apiName Add service
 * @apiGroup WebAPI Business - Service
 * @apiDescription Add a new service.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     businessId              Business ID
 * @apiParam {String}     name                    Service name
 * @apiParam {String}     place                   Place of work (seller, customer, both)
 * @apiParam {String}     [description]           Service description
 * @apiParam {Object}     [originalPrice]         Service original price object (countryCode-string, currency-string, value-number, [timeUnit]-default|hour|day, [onRequest]-boolean(default:false)) eg. { "countryCode": "HR", "currency": "EUR", "value": 100, "timeUnit": "default", "onRequest": false }
 * @apiParam {String}     [businessTagId]         Business tag ID for the service
 * @apiParam {String}     [suggestedServiceId]    Suggested service ID
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1784061735033,
 *     "data": {
 *         "service": {
 *             "_id": "6a569f265deda20265771cda",
 *             "name": "šišanje",
 *             "description": "brbrbrbrrrrr",
 *             "originalPrice": {
 *                 "countryCode": "HR",
 *                 "currency": "EUR",
 *                 "value": 100,
 *                 "minValue": -1,
 *                 "maxValue": -1,
 *                 "singleValue": -1,
 *                 "unlimitedValue": -1,
 *                 "exclusiveValue": -1
 *             },
 *             "isDeleted": false,
 *             "numberOfReviews": 0,
 *             "numberOfViews": 0,
 *             "numberOfLikes": 0,
 *             "moderation": {
 *                 "status": 1
 *             },
 *             "type": 6,
 *             "hashtags": [],
 *             "appropriateForKids": false,
 *             "visibility": "public",
 *             "tribeIds": [],
 *             "communityIds": [],
 *             "featured": {
 *                 "isFeatured": false,
 *                 "countryCode": "default",
 *                 "created": 1784061734995
 *             },
 *             "allowPublicComments": false,
 *             "availableForExpo": false,
 *             "usedInExpoCount": 0,
 *             "oldSlugs": [],
 *             "businessId": "6a561fa0fd66633a96932d37",
 *             "created": 1784061734995,
 *             "modified": 1784061734995,
 *             "file": [],
 *             "image": [],
 *             "audiosForExpo": [],
 *             "contentPurchaseHistory": [],
 *             "reservations": [],
 *             "place": "seller",
 *             "createdAt": "2026-07-14T20:42:14.997Z",
 *             "updatedAt": "2026-07-14T20:42:14.997Z",
 *             "__v": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 443856 Invalid name
 * @apiError (Errors) 443972 Invalid description
 * @apiError (Errors) 443691 Invalid price country code
 * @apiError (Errors) 443990 Invalid currency
 * @apiError (Errors) 443741 Invalid price value
 * @apiError (Errors) 444007 Invalid place
 * @apiError (Errors) 444008 Invalid price time unit
 * @apiError (Errors) 4000007 Token not valid
 */

router.post(
  "/services",
  auth({ allowUser: true }),
  autoApproveProduct,
  async function (request, response) {
    try {
      const { autoApprove = false } = request;
      const { user } = request;
      const {
        businessId,
        name,
        description,
        originalPrice: op = null,
        place,
        businessTagId,
        suggestedServiceId,
      } = request.body;

      if (!businessId || !Utils.isValidObjectId(businessId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBusinessId,
          message: "ServiceController, add service - invalid businessId",
        });
      }

      const business = await Business.findById(businessId).lean();

      if (!business) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeBusinessNotFound,
          message: "ServiceController, add service - business not found",
        });
      }

      const allowed = await Logics.checkBusinessPermissions({
        userId: user._id.toString(),
        business,
        action: "services:add",
      });

      if (!allowed) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "ServiceController, add service - user is not allowed to add a service",
        });
      }

      const location = user.location || { type: "Point", coordinates: [0, 0] };

      const info = {
        type: Const.productTypeService,
        businessId: business._id.toString(),
        itemCount: 1,
        moderation: {
          // status: autoApprove ? Const.moderationStatusApproved : Const.moderationStatusPending,
          status: Const.moderationStatusApproved,
        },
        businessTagId,
        suggestedServiceId,
        ownerId: business.owner._id,
        location,
      };

      if (!name || typeof name !== "string" || name.length < 3 || name.length > 100) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidName,
          message: "ServiceController, add service - invalid name",
        });
      }
      info.name = name;

      if (description) {
        if (typeof description !== "string") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidDescription,
            message: "ServiceController, add service - invalid description",
          });
        }

        info.description = description;
      }

      if (!place || !["seller", "customer", "both"].includes(place)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidPlace,
          message: "ServiceController, add service - invalid place",
        });
      }
      info.place = place;

      if (op) {
        if (!op.countryCode || !countries[op.countryCode]) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCountryCode,
            message: "ServiceController, add service - invalid originalPrice countryCode",
          });
        }
        if (!op.currency || !countries[op.countryCode].currency.includes(op.currency)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCurrency,
            message: "ServiceController, add service - invalid originalPrice currency",
          });
        }
        if (!op.value || typeof op.value !== "number" || op.value < 0) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidValueParameter,
            message: "ServiceController, add service - invalid originalPrice value",
          });
        }
        if (op.timeUnit && !["default", "hour", "day"].includes(op.timeUnit)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidPriceTimeUnit,
            message: "ServiceController, add service - invalid originalPrice time unit",
          });
        }

        info.originalPrice = {
          countryCode: op.countryCode,
          currency: op.currency,
          value: op.value,
          timeUnit: op.timeUnit || "default",
          onRequest: !!op.onRequest || false,
        };
      }

      const service = await Product.create(info);

      await Business.findByIdAndUpdate(businessId, { lastActive: Date.now() });

      if (!suggestedServiceId) {
        const normalizedName = ServiceCandidate.normalizeName(name);

        await ServiceCandidate.updateOne(
          { normalizedName, businessTagId, market: user.countryCode },
          { $addToSet: { names: name, businessIds: businessId } },
          { upsert: true },
        );
      }

      Base.successResponse(response, Const.responsecodeSucceed, { service: service.toObject() });
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.httpCodeServerError,
        message: "ServiceController, add service",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/businesses/services/:serviceId  Update service flom_v1
 * @apiVersion 2.0.34
 * @apiName Update service
 * @apiGroup WebAPI Business - Service
 * @apiDescription Update an existing service.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     [businessId]      Business ID
 * @apiParam {String}     [name]            Service name
 * @apiParam {String}     [description]     Service description
 * @apiParam {String}     [place]           Place of work (seller, customer, both)
 * @apiParam {Object}     [originalPrice]   Service original price object (countryCode-string, currency-string, value-number, [timeUnit]-default|hour|day, [onRequest]-boolean(default:false)) eg. { "countryCode": "HR", "currency": "EUR", "value": 100, "timeUnit": "default", "onRequest": false }
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "service": {
 *             "_id": "6a569f265deda20265771cda",
 *             "name": "šišanje",
 *             "description": "brbrbrbrrrrr",
 *             "originalPrice": {
 *                 "countryCode": "HR",
 *                 "currency": "EUR",
 *                 "value": 100,
 *                 "minValue": -1,
 *                 "maxValue": -1,
 *                 "singleValue": -1,
 *                 "unlimitedValue": -1,
 *                 "exclusiveValue": -1
 *             },
 *             "isDeleted": false,
 *             "numberOfReviews": 0,
 *             "numberOfViews": 0,
 *             "numberOfLikes": 0,
 *             "moderation": {
 *                 "status": 1
 *             },
 *             "type": 6,
 *             "hashtags": [],
 *             "appropriateForKids": false,
 *             "visibility": "public",
 *             "tribeIds": [],
 *             "communityIds": [],
 *             "featured": {
 *                 "isFeatured": false,
 *                 "countryCode": "default",
 *                 "created": 1784061734995
 *             },
 *             "allowPublicComments": false,
 *             "availableForExpo": false,
 *             "usedInExpoCount": 0,
 *             "oldSlugs": [],
 *             "businessId": "6a561fa0fd66633a96932d37",
 *             "created": 1784061734995,
 *             "modified": 1784061734995,
 *             "file": [],
 *             "image": [],
 *             "audiosForExpo": [],
 *             "contentPurchaseHistory": [],
 *             "reservations": [],
 *             "place": "seller",
 *             "createdAt": "2026-07-14T20:42:14.997Z",
 *             "updatedAt": "2026-07-14T20:42:14.997Z",
 *             "__v": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443988 Invalid service id
 * @apiError (Errors) 443989 Service not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 443856 Invalid name
 * @apiError (Errors) 443972 Invalid description
 * @apiError (Errors) 443691 Invalid price country code
 * @apiError (Errors) 443990 Invalid currency
 * @apiError (Errors) 443741 Invalid price value
 * @apiError (Errors) 444007 Invalid place
 * @apiError (Errors) 444008 Invalid price time unit
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/services/:serviceId",
  auth({ allowUser: true }),
  autoApproveProduct,
  async function (request, response) {
    try {
      const { autoApprove = false } = request;
      const { user } = request;
      const { serviceId } = request.params;
      const { name, description, originalPrice: op = null, businessId, place } = request.body;

      if (!serviceId || !Utils.isValidObjectId(serviceId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidServiceId,
          message: "ServiceController, update service - invalid serviceId",
        });
      }

      const service = await Product.findById(serviceId).lean();

      if (!service) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeServiceNotFound,
          message: "ServiceController, update service - service not found",
        });
      }

      const allowed = await Logics.checkBusinessPermissions({
        userId: user._id.toString(),
        businessId: service.businessId.toString(),
        action: "prices:edit",
      });

      if (!allowed) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "ServiceController, update service - user is not allowed to update the service",
        });
      }

      /* const info = {
        "moderation.status": autoApprove
          ? Const.moderationStatusApproved
          : Const.moderationStatusPending,
      }; */
      const info = {};

      if (businessId) {
        if (!Utils.isValidObjectId(businessId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBusinessId,
            message: "ServiceController, update service - invalid businessId",
          });
        }

        const business = await Business.findById(businessId).lean();

        if (!business) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeBusinessNotFound,
            message: "ServiceController, update service - business not found",
          });
        }

        info.businessId = businessId;
      }

      if (name) {
        if (typeof name !== "string" || name.length < 3 || name.length > 100) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidName,
            message: "ServiceController, update service - invalid name",
          });
        }

        info.name = name;
      }

      if (description) {
        if (typeof description !== "string") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidDescription,
            message: "ServiceController, update service - invalid description",
          });
        }

        info.description = description;
      }

      if (place) {
        if (!["seller", "customer", "both"].includes(place)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidPlace,
            message: "ServiceController, update service - invalid place",
          });
        }

        info.place = place;
      }

      if (op) {
        if (!op.countryCode || !countries[op.countryCode]) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCountryCode,
            message: "ServiceController, update service - invalid originalPrice countryCode",
          });
        }
        if (!op.currency || !countries[op.countryCode].currency.includes(op.currency)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCurrency,
            message: "ServiceController, update service - invalid originalPrice currency",
          });
        }
        if (!op.value || typeof op.value !== "number" || op.value < 0) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidValueParameter,
            message: "ServiceController, update service - invalid originalPrice value",
          });
        }
        if (op.timeUnit && !["default", "hour", "day"].includes(op.timeUnit)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidPriceTimeUnit,
            message: "ServiceController, update service - invalid originalPrice time unit",
          });
        }

        info.originalPrice = {
          countryCode: op.countryCode,
          currency: op.currency,
          value: op.value,
          timeUnit: op.timeUnit || "default",
          onRequest: !!op.onRequest || false,
        };
      }

      const updatedService = await Product.findByIdAndUpdate(serviceId, info, {
        new: true,
        lean: true,
      });

      await Business.findByIdAndUpdate(service.businessId, { lastActive: Date.now() });

      Base.successResponse(response, Const.responsecodeSucceed, { service: updatedService });
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.httpCodeServerError,
        message: "ServiceController, update service",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/businesses/services/:serviceId  Delete service flom_v1
 * @apiVersion 2.0.34
 * @apiName Delete service
 * @apiGroup WebAPI Business - Service
 * @apiDescription Delete an existing service.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443988 Invalid service id
 * @apiError (Errors) 443989 Service not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 4000007 Token not valid
 */

router.delete(
  "/services/:serviceId",
  auth({ allowUser: true }),
  async function (request, response) {
    try {
      const { user } = request;
      const { serviceId } = request.params;
      const { name, description, originalPrice: op } = request.body;

      if (!serviceId || !Utils.isValidObjectId(serviceId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidServiceId,
          message: "ServiceController, delete service - invalid serviceId",
        });
      }

      const service = await Product.findById(serviceId).lean();

      if (!service) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeServiceNotFound,
          message: "ServiceController, delete service - service not found",
        });
      }

      const allowed = await Logics.checkBusinessPermissions({
        userId: user._id.toString(),
        businessId: service.businessId.toString(),
        action: "services:delete",
      });

      if (!allowed) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserNotAllowed,
          message: "ServiceController, delete service - user is not allowed to delete the service",
        });
      }

      await Product.findByIdAndUpdate(serviceId, { isDeleted: true });

      Base.successResponse(response, Const.responsecodeSucceed, {});
    } catch (error) {
      return Base.newErrorResponse({
        response,
        code: Const.httpCodeServerError,
        message: "ServiceController, delete service",
        error,
      });
    }
  },
);

module.exports = router;
