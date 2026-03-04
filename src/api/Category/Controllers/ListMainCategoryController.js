"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { MainCategory } = require("#models");

/**
      * @api {post} /api/v2/mainCategory/list List Categories
      * @apiName List Main Categories
      * @apiGroup WebAPI
      * @apiDescription List Main Categories
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiSuccessExample Success-Response:
        {
        "code": 1,
        "time": 1540989079012,
        "data": [
            {
                "_id": "5bd98d220bb237660b061159",
                "name": "default",
                "__v": 0
            }
        ]
    }
            
    **/

router.post("/", async function (request, response) {
  try {
    const categories = await MainCategory.find().lean();

    Base.successResponse(response, Const.responsecodeSucceed, categories);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ListMainCategoryController", e);
    return;
  }
});

module.exports = router;
