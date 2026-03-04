"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Group } = require("#models");
const { getUsersOnlineStatus } = require("#logics");

/**
     * @api {get} /api/v2/group/users/:groupId/:page GroupUserList
     * @apiName GroupUserList
     * @apiGroup WebAPI
     * @apiDescription Returns users of the group
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:


{ code: 1,
  time: 1457096396842,
  data: 
   { count: 4,
     list: 
      [ { _id: '56d986cbfc6914974deb7676',
          name: 'test',
          userid: 'userid17RH5J',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395204,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395644,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'max.jpg',
                size: 64914,
                mimeType: 'image/png',
                nameOnServer: 'dDCn5wYHP7d8RkkwvoaTZxdckv8IRqDX' },
             picture: 
              { originalName: 'max.jpg',
                size: 64914,
                mimeType: 'image/png',
                nameOnServer: 'RChBqbqMVD7ScoaTUcc2iSvVRTuoJybp' } } },
        { _id: '56d986cbfc6914974deb7677',
          name: 'User2',
          userid: 'userid22eVJu',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395215,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395639,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'user1.jpg',
                size: 36023,
                mimeType: 'image/png',
                nameOnServer: 'l4GFBU2lzNa42q7Rymx31q96u3XpgPbV' },
             picture: 
              { originalName: 'user1.jpg',
                size: 36023,
                mimeType: 'image/png',
                nameOnServer: 'ThremyfFhXrP6YlqxOAzva52Jpx7ulfx' } } },
        { _id: '56d986cbfc6914974deb7678',
          name: 'User3',
          userid: 'userid3RP0zE',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395221,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395640,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'user2.jpg',
                size: 53586,
                mimeType: 'image/png',
                nameOnServer: 'pILnZ13qS1PldslPmuGwPKC3FkwZrTP1' },
             picture: 
              { originalName: 'user2.jpg',
                size: 53586,
                mimeType: 'image/png',
                nameOnServer: 'Tqy2TWTJO9qblAixb578ZhiFOthENw7F' } } },
        { _id: '56d986cbfc6914974deb7679',
          name: 'User4',
          userid: 'userid4tIcLG',
          password: '*****',
          organizationId: '56d986cbfc6914974deb7675',
          created: 1457096395228,
          status: 1,
          __v: 0,
          tokenGeneratedAt: 1457096395644,
          token: '*****',
          description: null,
          departments: [],
          groups: [],
          avatar: 
           { thumbnail: 
              { originalName: 'user3.png',
                size: 54101,
                mimeType: 'image/png',
                nameOnServer: 'Pit9pVfi3jVuWG2HbvlCoZzPOg8xQJwg' },
             picture: 
              { originalName: 'user3.png',
                size: 54101,
                mimeType: 'image/png',
                nameOnServer: 'Kvay7NvUPMvMiYkjPJvOogcVNLJZgejO' } } } ] } }
                

**/

router.get("/:groupId/:page", auth({ allowUser: true }), async function (request, response) {
  try {
    const result = {};
    const groupId = request.params.groupId;
    const page = request.params.page - 1;

    if (!groupId) {
      return Base.successResponse(response, Const.responsecodeGroupDetailInvalidGroupId);
    }

    const groupFindResult = await Group.findById(groupId).lean();

    if (!groupFindResult) {
      return Base.successResponse(response, Const.responsecodeGroupDetailInvalidGroupId);
    }

    result.group = groupFindResult;

    const users = await User.find({ _id: { $in: result.group.users } })
      .sort({ sortName: "asc" })
      .skip(Const.pagingRows * page)
      .limit(Const.pagingRows)
      .lean();
    result.list = users;

    const userIds = users.map((user) => user._id);
    const onlineStatusResult = await getUsersOnlineStatus(userIds);

    result.list.forEach((user) => {
      const onlineStatusRow = onlineStatusResult.find(
        (row) => row.userId.toString() === user._id.toString(),
      );
      user.onlineStatus = onlineStatusRow ? onlineStatusRow.onlineStatus : null;
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      count: result.group.users.length,
      list: result.list,
    });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "GroupUsersController", error);
  }
});

module.exports = router;
