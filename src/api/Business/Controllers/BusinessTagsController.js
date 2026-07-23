"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config, businessTags } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs/promises");

/**
 * @api {get} /api/v2/businesses/tags/groups  Get business tag groups flom_v1
 * @apiVersion 2.0.34
 * @apiName  Get business tag groups
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to get business tag groups.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1784799679740,
 *     "data": {
 *         "groups": [
 *             {
 *                 "groupId": "beauty",
 *                 "displayName": "Beauty"
 *             },
 *             {
 *                 "groupId": "fashion",
 *                 "displayName": "Fashion"
 *             },
 *             {
 *                 "groupId": "food",
 *                 "displayName": "Food"
 *             }
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/groups", async function (request, response) {
  try {
    const { user } = request;

    const groups = [],
      groupIds = [];

    businessTags.forEach((t) => {
      if (t.group && !groupIds.includes(t.groupId)) {
        groups.push({ groupId: t.groupId, displayName: t.group });
        groupIds.push(t.groupId);
      }
    });

    return Base.successResponse(response, Const.responsecodeSucceed, { groups });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessTagsController",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/tags  Get business tags flom_v1
 * @apiVersion 2.0.34
 * @apiName  Get business tags
 * @apiGroup WebAPI Business
 * @apiDescription  API which is called to get business tags.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query parameter) {String} [market]   Market code to filter tags (country code - HR, NG, US)
 * @apiParam (Query parameter) {String} [group]    Group name to filter tags (case insensitive)
 * @apiParam (Query parameter) {String} [groupId]  Group ID to filter tags
 * @apiParam (Query parameter) {String} [keyword]  Keyword to search tags (at least 2 characters)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783594331131,
 *     "data": {
 *         "tags": [
 *             {
 *                 "id": "tag_vulcanizing_tyres",
 *                 "slug": "vulcanizing-tyres",
 *                 "group": "Auto",
 *                 "groupId": "auto",
 *                 "display": {
 *                     "en-NG": "Tyres & Vulcanizing",
 *                     "default": "Tyres & Vulcanizing"
 *                 },
 *                 "synonyms": [
 *                     "vulcanizer",
 *                     "tyre",
 *                     "wheel balancing"
 *                 ],
 *                 "regulated": null,
 *                 "markets": [
 *                     "NG"
 *                 ]
 *             },
 *             {
 *                 "id": "tag_transport_rides",
 *                 "slug": "transport-rides",
 *                 "group": "Auto",
 *                 "groupId": "auto",
 *                 "display": {
 *                     "en-NG": "Transport & Rides",
 *                     "default": "Transport & Rides"
 *                 },
 *                 "synonyms": [
 *                     "okada",
 *                     "keke",
 *                     "bus",
 *                     "taxi",
 *                     "driver",
 *                     "car hire"
 *                 ],
 *                 "regulated": null,
 *                 "markets": [
 *                     "NG"
 *                 ]
 *             },
 *             {
 *                 "id": "tag_delivery",
 *                 "slug": "delivery",
 *                 "group": "Auto",
 *                 "groupId": "auto",
 *                 "display": {
 *                     "en-NG": "Delivery & Dispatch",
 *                     "default": "Delivery & Dispatch"
 *                 },
 *                 "synonyms": [
 *                     "dispatch rider",
 *                     "courier",
 *                     "logistics",
 *                     "errand",
 *                     "waybill"
 *                 ],
 *                 "regulated": {
 *                     "requires": [
 *                         "serviceZones"
 *                     ],
 *                     "unlocks": [
 *                         "courier_surfaces"
 *                     ]
 *                 },
 *                 "markets": [
 *                     "NG"
 *                 ]
 *             }
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    let { market = null, group = null, keyword = null, groupId = null } = request.query;
    market = market || user.countryCode;
    keyword = keyword ? keyword.trim() : null;

    const tags = businessTags.filter((t) => {
      if (market && t.markets && !t.markets.includes(market)) {
        return false;
      }

      if (group && t.group.toLowerCase() !== group.toLowerCase()) {
        return false;
      }

      if (groupId && t.groupId !== groupId) {
        return false;
      }

      if (keyword && keyword.length > 1) {
        if (
          !t.slug.includes(keyword.toLowerCase()) &&
          !t.synonyms.some((s) => s.includes(keyword.toLowerCase()))
        ) {
          return false;
        }
      }

      return true;
    });

    return Base.successResponse(response, Const.responsecodeSucceed, { tags });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessTagsController",
      error,
    });
  }
});

module.exports = router;
