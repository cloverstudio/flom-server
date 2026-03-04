"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { searchGroup } = require("#logics");

/**
     * @api {get} /api/v2/group/search/:page?keyword=******** search group
     * @apiName Seach Group
     * @apiGroup WebAPI
     * @apiDescription Returns groups matched to keyword
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:
{
	code: 1,
	time: 1457086227601,
	data: {
		list: [{
			_id: '56d95f128da73e481e25b4c6',
			name: 'GROUP 1',
			sortName: 'group 1',
			description: 'GROUP 1 DESCRIPTION',
			created: 1457086226073,
			organizationId: '56d95f128da73e481e25b4c1',
			__v: 0,
			users: ['56d95f128da73e481e25b4c2',
				'56d95f128da73e481e25b4c3',
				'56d95f128da73e481e25b4c4',
				'56d95f128da73e481e25b4c5'
			],
			avatar: {
				thumbnail: {
					originalName: 'user1.jpg',
					size: 46100,
					mimeType: 'jpeg',
					nameOnServer: 'wvz4ezsEtgqTlQ6ec740gCKg48OB6df1'
				},
				picture: {
					originalName: 'user1.jpg',
					size: 36023,
					mimeType: 'image/jpeg',
					nameOnServer: 'hLWVa6YetMzzw8gNZoR2zHKnz1WYuyVq'
				}
			},
			usersCount: 4,
			userModels: [{
				_id: '56d95f128da73e481e25b4c2',
				name: 'test',
				userid: 'userid1RgQus',
				password: '*****',
				organizationId: '56d95f128da73e481e25b4c1',
				created: 1457086226039,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086226476,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'max.jpg',
						size: 64914,
						mimeType: 'image/png',
						nameOnServer: 'Bd8PfEfryfFKm87GPPgK7vCFjavFsGRT'
					},
					picture: {
						originalName: 'max.jpg',
						size: 64914,
						mimeType: 'image/png',
						nameOnServer: '28PCuc4iljhbxuPHDYGXlBUZHU1wjP7y'
					}
				}
			}, {
				_id: '56d95f128da73e481e25b4c3',
				name: 'User2',
				userid: 'userid2KHQyH',
				password: '*****',
				organizationId: '56d95f128da73e481e25b4c1',
				created: 1457086226050,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086226471,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'user1.jpg',
						size: 36023,
						mimeType: 'image/png',
						nameOnServer: 'YNuPww9hx1QZkzXrrxxn7OjTRSTrqmDk'
					},
					picture: {
						originalName: 'user1.jpg',
						size: 36023,
						mimeType: 'image/png',
						nameOnServer: 'aYdcKWAtOWBZbUWQMiaInmkz7esHuYpY'
					}
				}
			}, {
				_id: '56d95f128da73e481e25b4c4',
				name: 'User3',
				userid: 'userid3NmVQ6',
				password: '*****',
				organizationId: '56d95f128da73e481e25b4c1',
				created: 1457086226055,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086226472,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'user2.jpg',
						size: 53586,
						mimeType: 'image/png',
						nameOnServer: 'uOkWAaLBQaITjgA7NVtUz0NC1Q5e9wOC'
					},
					picture: {
						originalName: 'user2.jpg',
						size: 53586,
						mimeType: 'image/png',
						nameOnServer: '3OYwlwUojGskBF6NXdb2LK1sWuEaaeht'
					}
				}
			}, {
				_id: '56d95f128da73e481e25b4c5',
				name: 'User4',
				userid: 'userid4eZJ83',
				password: '*****',
				organizationId: '56d95f128da73e481e25b4c1',
				created: 1457086226058,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086226476,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'user3.png',
						size: 54101,
						mimeType: 'image/png',
						nameOnServer: 'Jxl4Q0IkuGhPFk4AGLPzlyV19ACWlKyl'
					},
					picture: {
						originalName: 'user3.png',
						size: 54101,
						mimeType: 'image/png',
						nameOnServer: 'iMpc4pbIqnazrSXhucTn8gTCfE4WJp0u'
					}
				}
			}]
		}],
		count: 1
	}
}
**/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const keyword = request.query.keyword;
    const result = await searchGroup(request.user, keyword, 0);

    Base.successResponse(response, Const.responsecodeSucceed, {
      list: result.list,
      count: result.count,
    });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "GroupSearchController - GET", error);
    return;
  }
});

router.get("/:page", auth({ allowUser: true }), async function (request, response) {
  try {
    const keyword = request.query.keyword;
    let page = 0;
    if (request.params.page) {
      page = +request.params.page - 1;
    }

    const result = await searchGroup(request.user, keyword, page);

    return Base.successResponse(response, Const.responsecodeSucceed, {
      list: result.list,
      count: result.count,
    });
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "GroupListController - GET page",
      error,
    );
  }
});

module.exports = router;
