"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { MainCategory, SubCategory } = require("#models");

/**
      * @api {post} /api/v2/subCategory/list List Categories
      * @apiName List Sub Categories
      * @apiGroup WebAPI
      * @apiDescription List Categories
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * @apiParam {string} mainCategoryId mainCategoryId
      * 
      * @apiSuccessExample Success-Response:
        
            
    **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  const mainCategoryId = request.body.mainCategoryId;

  if (!mainCategoryId) {
    logger.error("ListSubCategoryController, missing main category id");
    return Base.successResponse(response, Const.responsecodeNoMainCategoryId);
  }

  try {
    const mainCat = await MainCategory.findOne({ _id: mainCategoryId }).lean();

    const query = {};
    if (mainCat.name != "Buy and Sell") {
      query.mainCategoryId = mainCategoryId;
    }

    const subCategories = await SubCategory.find(query).lean();

    Base.successResponse(response, Const.responsecodeSucceed, subCategories);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ListSubCategoryController", e);
    return;
  }
});

module.exports = router;
