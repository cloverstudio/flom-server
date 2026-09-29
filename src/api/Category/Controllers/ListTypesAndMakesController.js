"use strict";

const router = require("express").Router();
const Base = require("../../Base");
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
    return Base.errorResponse({
      response,
      code: Const.responsecodeNoSubCategoryId,
      message: "ListTypesAndMakesController, missing sub category id",
    });
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
  } catch (error) {
    Base.errorResponse({
      response,
      message: "ListTypesAndMakesController, Get list of types and makes",
      error,
    });
  }
});

module.exports = router;
