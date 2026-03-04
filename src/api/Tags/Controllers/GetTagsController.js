"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { Tag } = require("#models");

/**
 * @api {get} /api/v2/tags/popular Get First 20 Popular Tags
 * @apiVersion 1.0.0
 * @apiName Get Popular Tags
 * @apiGroup WebAPI Tags
 * @apiDescription API for fetching top 20 popular tags that starts with the given name. Will be used for autocomplete.
 *
 * @apiParam None
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1653467329099,
 *   "data": {
 *     "tags": [
 *         {
 *             "name": "auto1",
 *             "count": 5
 *         },
 *         {
 *             "name": "auto",
 *             "count": 4
 *         },
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 */

router.get("/", async function (request, response) {
  try {
    const partOfName = request.query.name;

    const tags = await Tag.find({ name: new RegExp(partOfName, "i") })
      .sort({ count: -1 })
      .limit(20)
      .lean();

    const listOfTagsForResponse = tags.map((tag) => {
      return { name: tag.name, count: tag.count };
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      tags: listOfTagsForResponse,
    });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      message: "GetTagsController",
      error,
    });
  }
});

module.exports = router;
