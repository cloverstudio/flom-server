"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, FlomTag } = require("#models");
const { recombee } = require("#services");
const fsp = require("fs/promises");

/**
      * @api {post} /api/v2/product/delete Delete Product
      * @apiName Delete Product
      * @apiGroup WebAPI
      * @apiDescription Delete Product
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {String} productId productId
      * 
      * @apiSuccessExample Success-Response:
        {"code": 1,
            "time": 1538639942767,
            "data": {}
        }
            
    **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const productId = request.body.productId;
    const user = request.user;

    // check if product exist
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) return Base.successResponse(response, Const.responsecodeProductNotFound);

    // check owner
    if (product.ownerId != user._id.toString())
      return Base.successResponse(response, Const.responsecodeUserIsNotProductOwner);

    if (product.contentPurchaseHistory && product.contentPurchaseHistory.length > 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAudioProductInUse,
        message: `DeleteProductController, audio product is in use by other users`,
      });
    }

    if (product?.mediaProcessingInfo?.status === "processing") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductMediaIsProcessing,
        message: "DeleteProductController, product media is processing",
      });
    }
    if (product?.mediaProcessingInfo?.status === "failed") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeProductMediaProcessingFailed,
        message: "DeleteProductController, product media processing failed",
      });
    }

    await Promise.all(
      product._doc.hashtags.map(async (hashtag) => {
        //find to check count
        const tag = await FlomTag.findOne({ _id: hashtag });
        const tagRes = tag?.toObject();

        //when product is deleted, hashtag counter must be reduced by 1 or hashtag must be deleted when counter drops to zero
        if (tag.count > 1) {
          const tagToBeSaved = await FlomTag.findOneAndUpdate(
            { _id: hashtag },
            { count: tag.count - 1 },
          );
        } else if (tag.count == 1) {
          await FlomTag.deleteOne({ _id: hashtag });
        }
      }),
    );

    const files = product.file;

    for (var i = 0; i < files.length; i++) {
      const { file, thumb } = files[i];
      if (file.nameOnServer) {
        const ext = file.mimeType === "video/mp4" ? ".mp4" : "";
        let path = Config.uploadPath + "/" + file.nameOnServer + ext;
        await fsp.unlink(path);
        success(file.nameOnServer + ext);
      }
      if (thumb.nameOnServer) {
        let thumbPath = Config.uploadPath + "/" + thumb.nameOnServer;
        await fsp.unlink(thumbPath);
        success(thumb.nameOnServer);
      }
      if (file.hslName) {
        const hslPath = Config.uploadPath + "/" + file.hslName + ".m3u8";
        Utils.deleteHslFile(hslPath, success);
      }
    }

    product.isDeleted = true;
    product.modified = Date.now();

    try {
      await recombee.upsertProduct({ product: product.toObject() });
    } catch (error) {
      logger.error("DeleteProductController, recombee", error);
    }

    try {
      await product.save();
    } catch (error) {
      logger.error("DeleteProductController, product save error", error);
      return Base.successResponse(response, Const.responsecodeProductDeleteError);
    }

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (e) {
    Base.errorResponse(response, Const.httpCodeServerError, "DeleteProductController", e);
    return;
  }
});

function success(name) {
  return logger.info("DeleteProductController: " + name);
}

module.exports = router;
