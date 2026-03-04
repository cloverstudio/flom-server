"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const { DidWWLog } = require("#models");

/**
     * @api {post} /api/v2/login/did/get-number Get free destination number
     * @apiName Get free destination number
     * @apiGroup WebAPI
     * @apiDescription  checks if there is user with given phone number
     * @apiHeader {String} UUID or uuid UUID
     * 
     *  @apiParam {String} phoneNumber phoneNumber
     *
     * @apiSuccessExample Success-Response:
        {
          "code": 1,
          "time": 1590063167731,
          "data": {
              "exists": false
            }
        }
  **/

router.post("", async (request, response) => {
  try {
    request.on("data", async (chunk) => {
      if (request.headers["content-encoding"] === "gzip") {
        zlib.gunzip(chunk, (error, buff) => {
          if (error !== null) {
            logger.error("DidWWCallbackController", error);
          } else {
            logger.info("DidWWCallbackController, Gzip: " + typeof buff);
            logger.info("DidWWCallbackController, buffer: " + buff.toString());
          }
        });
      } else {
        logger.info("DidWWCallbackController, chunk: " + chunk.toString());
        const chunkJson = JSON.parse(chunk.toString());

        if (chunkJson.type === "incoming-call-start-event") {
          const sourcePhoneNumber = chunkJson.attributes.src_number.trim().startsWith("+")
            ? chunkJson.attributes.src_number.trim()
            : "+" + chunkJson.attributes.src_number.trim();
          const destinationPhoneNumber = chunkJson.attributes.did_number.trim().startsWith("+")
            ? chunkJson.attributes.did_number.trim()
            : "+" + chunkJson.attributes.did_number.trim();

          //Spremi u bazu
          await DidWWLog.create({
            sourcePhoneNumber,
            destinationPhoneNumber,
          });
        }
      }
    });
    request.on("end", () => {
      logger.info("DidWWCallbackController, stream ended");
    });

    Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (e) {
    return Base.errorResponse(response, Const.httpCodeServerError, "DidWWCallbackController", e);
  }
});

module.exports = router;
