"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Category } = require("#models");

/**
 * @api {post} /api/v2/category/list List Categories
 * @apiVersion 2.0.10
 * @apiName List Categories
 * @apiGroup WebAPI Category
 * @apiDescription List Categories. If parent category name is "Buy and Sell" API will return all non parent categories.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     [parentId]  Category parentId
 * @apiParam {Number[]}   [groups]    Category groups to filter the results by. Groups: 1 - all, 2 - creators, 3 - merchants, 11 - video, 12 - video story,
 *                                    13 - podcast, 14 - text story, 15 - product. API will return categories with given groups, plus categories with group 1
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1644403934486,
 *   "data": [
 *     {
 *       "_id": "5ca44cfa08f8045e4e3471dc",
 *       "name": "Automobiles",
 *       "parentId": "-1",
 *       "group": [
 *         1
 *       ]
 *     }
 *   ]
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443457 Invalid group parameter. Either parameter is not an array or the array contains invalid values
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", async function (request, response) {
  try {
    const parentId = request.body.parentId || "-1";
    let groups = [];

    if (request.body.groups) {
      if (!Array.isArray(request.body.groups)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidGroup,
          message: `ListCategoryController, invalid groups parameter`,
        });
      }

      groups = request.body.groups
        .map((group) => +group)
        .filter((group) => Const.categoryGroups.indexOf(group) !== -1);

      if (request.body.groups.length !== groups.length) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidGroup,
          message: `ListCategoryController, invalid groups parameter`,
        });
      }
    }

    const parentCategory = parentId !== "-1" && (await Category.findOne({ _id: parentId }).lean());

    const query = { deleted: false };

    if (parentCategory?.name === "Buy and Sell") {
      query.parentId = { $ne: "-1" };
      query.name = { $ne: "Others" };
    } else {
      query.parentId = parentId;
    }

    if (parentId === "-1" && groups.length > 0) {
      groups.push(Const.categoryGroupAll);
      query.group = { $in: [...new Set(groups)] };
    }

    const categories = await Category.find(query)
      .sort({ name: 1 })
      .collation({ locale: "en", caseLevel: true })
      .lean();

    Base.successResponse(response, Const.responsecodeSucceed, categories);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ListCategoryController", e);
    return;
  }
});

module.exports = router;
