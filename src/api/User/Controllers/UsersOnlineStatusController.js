"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { getUsersOnlineStatus } = require("#logics");

/**
      * @api {post} /api/v2/user/online-status Users Online Status
      * @apiName User Online Status
      * @apiGroup WebAPI
      * @apiDescription User Online Status
      
      * @apiHeader {String} access-token Users unique access-token.

      * @apiParam {String[]} userIds - array of userIds
      * 
      * @apiSuccessExample Success-Response:
        {
            "code": 1,
            "time": 1507293117920,
            "data": [
								{
										"userId": "5caf3cf1e9ad4e2e953cb262",
										"onlineStatus": null,
										"lastSeen": 1585639325690
								},
								{
										"userId": "5e566b6e4fde484cd69593be",
										"onlineStatus": null,
										"lastSeen": 1585578186969
								},
								{
										"userId": "5e81d6a601286617b1e685be",
										"onlineStatus": null,
										"lastSeen": 1585568866124
								}
						]
        }
 
     */

router.post("/", async (request, response) => {
  try {
    let { userIds } = request.body;

    if (
      typeof userIds === "undefined" ||
      userIds === null ||
      userIds === "" ||
      userIds === undefined ||
      userIds.length === 0
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserIdsMustBeDefined,
        message: "UsersOnlineStatusController, no userIds provided",
      });
    }

    if (!Array.isArray(userIds)) {
      userIds = userIds.split(",");
    }

    if (userIds.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserIdsMustBeDefined,
        message: "UsersOnlineStatusController, userIds empty array",
      });
    }

    const onlineStatus = await getUsersOnlineStatus(userIds);

    return Base.successResponse(response, Const.responsecodeSucceed, onlineStatus);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UsersOnlineStatusController",
      error,
    });
  }
});

module.exports = router;
