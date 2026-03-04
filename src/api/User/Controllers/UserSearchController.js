"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { searchUser } = require("#logics");

/**
     * @api {get} /api/v2/user/search/:page?keyword=******** search user
     * @apiName Seach User
     * @apiGroup WebAPI
     * @apiDescription Returns users matched to keyword
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:
{
    code: 1,
    time: 1456698684520,
    data: {
        list: [{
            _id: '56d3753c294ed9761afe489c',
            name: 'user1',
            userid: 'userid1ilmaN',
            password: '*****',
            organizationId: '56d3753b294ed9761afe489b',
            created: 1456698684006,
            status: 1,
            __v: 0,
            tokenGeneratedAt: 1456698684452,
            token: '*****',
            departments: [],
            groups: [],
            onelineStatus: 0
        }],
        count: 1
    }
}
**/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const keyword = request.query.keyword;

    const result = await searchUser(request.user, keyword, 0);

    Base.successResponse(response, Const.responsecodeSucceed, {
      list: result.list,
      count: result.count,
    });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "UserSearchController", error);
  }
});

router.get("/:page", auth({ allowUser: true }), async function (request, response) {
  try {
    const keyword = request.query.keyword;
    const page = +request.params.page - 1;

    const result = await searchUser(request.user, keyword, page);

    Base.successResponse(response, Const.responsecodeSucceed, {
      list: result.list,
      count: result.count,
    });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "UserSearchController, PAGE", error);
  }
});

module.exports = router;
