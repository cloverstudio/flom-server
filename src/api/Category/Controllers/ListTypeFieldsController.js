"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Type, SubType, Color, Brand, Gender, Size } = require("#models");

/**
 * @api {post} /api/v2/subCategory/listTypeFields List Type Fields
 * @apiName List Type Fields
 * @apiGroup WebAPI
 * @apiDescription List Type Fields
 *
 * @apiHeader {String} access-token Users unique access-token.
 * @apiParam {string} typeId typeId
 *
 * @apiSuccessExample Success-Response:
 *
 **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  const typeId = request.body.typeId;

  if (typeId === undefined) {
    logger.error("ListTypeFieldsController, no type id");
    return Base.successResponse(response, Const.responsecodeNoTypeId);
  }

  try {
    let type = await Type.findOne({ _id: typeId }).select({
      _id: 1,
      genders: 1,
      sizes: 1,
      colors: 1,
      brands: 1,
      name: 1,
      subCategoryId: 1,
    });

    let subTypes = await SubType.find({ typeId });

    let genders = await Gender.find({ _id: { $in: type.genders } }).select({ _id: 1, name: 1 });

    let colors = await Color.find({ _id: { $in: type.colors } }).select({ _id: 1, name: 1 });

    let brands = await Brand.find({ _id: { $in: type.brands } }).select({ _id: 1, name: 1 });

    let sizes = await Size.find({ _id: { $in: type.sizes } }).select({ _id: 1, name: 1 });

    let result = {
      subTypes,
      genders,
      colors,
      brands,
      sizes,
    };

    Base.successResponse(response, Const.responsecodeSucceed, result);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ListTypeFieldsController", e);
    return;
  }
});

module.exports = router;
