"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { Product, User, View, ViewForYou } = require("#models");
const Logics = require("#logics");

/** 
      * @api {get} /api/v2/product/:productId/numberOfViews Add View To Product
      * @apiName Add View To Product
      * @apiGroup WebAPI
      * @apiDescription Add View To Product
      * 
      *   
      * @urliParam {String} productId productId
      * 
      * @apiSuccessExample Success-Response:
    {
        "code": 1,
        "time": 1536574245001,
        "data": {}
    }
    **/
router.get("/", async function (request, response) {
  try {
    const productId = request.params.productId;
    const accessToken = request.headers["access-token"];
    let user;

    if (accessToken) {
      user = await User.findOne({ "token.token": accessToken }).lean();
    }

    if (!productId) return Base.successResponse(response, Const.responsecodeProductNoProductId);

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          numberOfViews: 1,
        },
      },
      {
        new: true,
      },
    ).lean();

    Base.successResponse(response, Const.responsecodeSucceed);

    if (user) {
      try {
        const view = await View.create({
          productId: product._id,
          userId: user._id.toString(),
          productType: product.type,
        });

        await ViewForYou.create({
          productId: product._id.toString(),
          userId: user._id.toString(),
          categoryId: product.categoryId.toString(),
        });
      } catch (error) {
        logger.error("AddViewToProductController - View or ViewForYou error:", error);
      }

      Logics.addUserCategoryInteraction({ product, user });
      Logics.addUserTagInteraction({ product, user });
    }
  } catch (e) {
    if (e.name == "CastError") {
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.errorResponse(response, Const.httpCodeServerError, "AddViewToProductController", e);
    return;
  }
});

module.exports = router;
