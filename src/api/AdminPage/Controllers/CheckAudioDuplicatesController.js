"use strict";

const path = require("path");
const router = require("express").Router();
const Base = require("../../Base");
const { Config, Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, User } = require("#models");

/**
 * @api {get} /api/v2/admin-page/check-audio/:audioId  Check audio for duplicates flom_v1
 * @apiVersion 2.0.18
 * @apiName  Check audio for duplicates flom_v1
 * @apiGroup WebAPI Admin page
 * @apiDescription  API for checking if given audio (product or sound) is similar to already uploaded buyable audios.
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1707727335294,
 *     "data": {
 *         "similarAudios": [
 *             {
 *                 "id": "65c49be8066a7a17d0f9c733",
 *                 "name": "vopppp",
 *                 "description": "",
 *                 "created": 1707383784873,
 *                 "owner": {
 *                     "id": "63dceca0c30542684f1b7b68",
 *                     "userName": "mer19abc",
 *                     "phoneNumber": "+2348020000019",
 *                     "created": 1675422880810
 *                 },
 *                 "audioComparisonOutput": [
 *                     0.781
 *                 ]
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443850 Audio id missing
 * @apiError (Errors) 443851 Audio not found
 * @apiError (Errors) 443833 No file in audio model
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/:audioId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async function (request, response) {
    try {
      const audioId = request.params.audioId;

      if (!audioId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAudioIdMissing,
          message: "CheckAudioDuplicatesController, audio id missing",
        });
      }

      const audio = await Product.findById(audioId).lean();

      if (!audio) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAudioNotFound,
          message: "CheckAudioDuplicatesController, audio not found",
        });
      }

      const audioFileName = audio.file[0]?.file?.nameOnServer;

      if (!audioFileName) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoAudioFile,
          message: "CheckAudioDuplicatesController, audio does not contain file",
        });
      }

      const allAudioProducts = await Product.find({
        type: Const.productTypePodcast,
        isDeleted: false,
        availableForExpo: true,
      }).lean();

      const similarAudios = [];

      for (const product of allAudioProducts) {
        const fileName = product.file[0]?.file?.nameOnServer;

        if (!fileName) continue;

        const result = await Utils.compareAudioWithSoundalike({
          filePath1: path.resolve(Config.uploadPath, audioFileName),
          filePath2: path.resolve(Config.uploadPath, fileName),
        });

        if (result) {
          const values = [],
            highValues = [];
          const tempArray = result.split("\n");

          tempArray.forEach((temp) => {
            const trimmed = temp.trim();

            if (!!trimmed && !trimmed.startsWith("[")) {
              const numberString = trimmed.split(":")[1].trim();
              values.push(+numberString);

              if (+numberString > Const.audioComparisonSegmentAccuracyLimit) {
                highValues.push(+numberString);
              }
            }
          });

          if (highValues.length / values.length > Const.audioComparisonHitRatioLimit) {
            const { _id, name, description, created, ownerId } = product;
            const owner = (await User.findById(ownerId).lean()) || {};
            const { userName, phoneNumber, created: ownerCreated } = owner;

            const info = {
              id: _id.toString(),
              name,
              description: description || "",
              created,
              owner: {
                id: ownerId,
                userName,
                phoneNumber,
                created: ownerCreated,
              },
              audioComparisonOutput: values,
            };
            similarAudios.push(info);
          }
        }
      }

      Base.successResponse(response, Const.responsecodeSucceed, { similarAudios });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CheckAudioDuplicatesController",
        error,
      });
    }
  },
);

module.exports = router;
