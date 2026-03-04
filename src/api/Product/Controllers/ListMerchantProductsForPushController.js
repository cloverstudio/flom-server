"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Product } = require("#models");

/**
      * @api {get} /api/v2/product/list/my/push List Merchant Products
      * @apiName List Merchant Product
      * @apiGroup WebAPI
      * @apiDescription List Merchant Product
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiSuccessExample Success-Response:
        {
        "code": 1,
        "time": 1540989079012,
        "data": {
            "products": [
                {
                    "_id": "5bd7467d7d19320eb23450b5",
					"name": "tedt",    
					"file": []               
                }
            ]
        }
    }
            
    **/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    // check if user is merchant
    if (request.user.typeAcc !== 1 && request.user.flow.typeAcc !== 1) {
      return Base.successResponse(response, Const.responsecodeMerchantNotFound);
    }

    let products = await Product.find(
      { ownerId: request.user._id, isDeleted: false },
      { name: 1, file: 1 },
    );

    let dataToSend = {
      products: [],
    };

    if (products) {
      dataToSend.products = products.map((p) => {
        let pObj = p.toObject();

        if (pObj.file.length) pObj.file = pObj.file[0];

        return pObj;
      });
    }

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "ListMerchantProductsForPushController",
      e,
    );
    return;
  }
});

module.exports = router;
