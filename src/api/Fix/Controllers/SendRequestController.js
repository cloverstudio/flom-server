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

      const res = await Utils.sendRequest({
        allow: true,
        method,
        url,
        headers,
        body: data,
      });

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
