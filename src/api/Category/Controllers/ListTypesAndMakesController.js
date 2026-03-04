"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Type, VehicleMake } = require("#models");

/**
 * @api {post} /api/v2/subCategory/listTypesAndMakes List SubCategory types and makes
 * @apiName List SubCategory types and makes
 * @apiGroup WebAPI
 * @apiDescription List SubCategory types and makes
 *
 * @apiHeader {String} access-token Users unique access-token.
 * @apiParam {string} subCategoryId subCategoryId
 *
 * @apiSuccessExample Success-Response:
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  const subCategoryId = request.body.subCategoryId;

  if (!subCategoryId) {
    logger.error("ListTypesAndMakesController, no subcategory id");
    return Base.successResponse(response, Const.responsecodeNoSubCategoryId);
  }

  try {
    const types = await Type.find({ subCategoryId }).select({
      name: 1,
      subCategoryId: 1,
      _id: 1,
    });
    const vehicleMakes = await VehicleMake.find({ subCategoryId }).select({
      name: 1,
      subCategoryId: 1,
      _id: 1,
    });

    let result = { types, vehicleMakes };

    Base.successResponse(response, Const.responsecodeSucceed, result);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ListTypesAndMakesController", e);
    return;
  }
});

module.exports = router;
