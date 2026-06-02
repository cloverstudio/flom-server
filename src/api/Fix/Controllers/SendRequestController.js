"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");

router.post(
  "/",
  //auth({ allowUser: true }),
  async function (request, response) {
    try {
      const { method, url, headers, data } = request.body;

      const { data: res, err } = await Utils.sendRequest({
        method,
        url,
        headers,
        body: data,
      });

      if (err) {
        throw new Error(err);
      }

      const responseData = { res };
      Base.successResponse(response, Const.responsecodeSucceed, responseData);
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SendRequestController",
        error,
      });
    }
  },
);

module.exports = router;
