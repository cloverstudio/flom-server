"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { VehicleModel } = require("#models");

/**
      * @api {post} /api/v2/subCategory/listVehicleModel List Vehicle Models
      * @apiName List Vehicle Models
      * @apiGroup WebAPI
      * @apiDescription List Vehicle Models
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * @apiParam {string} vehicleMakeId vehicleMakeId
      * 
      * @apiSuccessExample Success-Response:  
      * {
            "code": 1,
            "time": 1568796241243,
            "data": [
                {
                    "_id": "5d80b016c2ee79490cb6c503",
                    "name": "Accord"
                },
                {
                    "_id": "5d80b016c2ee79490cb6c504",
                    "name": "Civic"
                },
                {
                    "_id": "5d80b016c2ee79490cb6c505",
                    "name": "CR-V"
                },
                {
                    "_id": "5d80b016c2ee79490cb6c506",
                    "name": "Pilot"
                }
            ]
        }     
    **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const vehicleMakeId = request.body.vehicleMakeId;

    if (vehicleMakeId === undefined) {
      logger.error("ListVehicleModelController, no vehicle make id");
      return Base.successResponse(response, Const.responsecodeNoVehicleMakeId);
    }

    let models = await VehicleModel.find({ vehicleMakeId }).select({ name: 1, _id: 1 });

    Base.successResponse(response, Const.responsecodeSucceed, models);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "ListVehicleModelController", e);
    return;
  }
});

module.exports = router;
