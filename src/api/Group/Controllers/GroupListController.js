"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { searchGroup } = require("#logics");

/**
     * @api {get} /api/v2/group/list/:page grouplist
     * @apiName List Group
     * @apiGroup WebAPI
     * @apiDescription Returns all groups
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:

{
	code: 1,
	time: 1457086011856,
	data: {
		list: [{
			_id: '56d95e3a999a71831bfdea65',
			name: 'GROUP 1',
			sortName: 'group 1',
			description: 'GROUP 1 DESCRIPTION',
			created: 1457086010379,
			organizationId: '56d95e3a999a71831bfdea60',
			__v: 0,
			users: ['56d95e3a999a71831bfdea61',
				'56d95e3a999a71831bfdea62',
				'56d95e3a999a71831bfdea63',
				'56d95e3a999a71831bfdea64'
			],
			avatar: {
				thumbnail: {
					originalName: 'user1.jpg',
					size: 46100,
					mimeType: 'jpeg',
					nameOnServer: '6CWKh3oDPZZOECEA6vzUknFMy5U1gRrT'
				},
				picture: {
					originalName: 'user1.jpg',
					size: 36023,
					mimeType: 'image/jpeg',
					nameOnServer: 'eNJdtFNW4bu9IZdQbt4oJwms7WbRelUC'
				}
			},
			usersCount: 4,
			userModels: [{
				_id: '56d95e3a999a71831bfdea61',
				name: 'test',
				userid: 'userid1OlegK',
				password: '*****',
				organizationId: '56d95e3a999a71831bfdea60',
				created: 1457086010345,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086010786,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'max.jpg',
						size: 64914,
						mimeType: 'image/png',
						nameOnServer: 'QLBDbupbTqPwPKQAXbq9gRop1OT7IHkc'
					},
					picture: {
						originalName: 'max.jpg',
						size: 64914,
						mimeType: 'image/png',
						nameOnServer: 'DyFSaCRcPddPCQKJyAXnbCL6icqgkyIt'
					}
				}
			}, {
				_id: '56d95e3a999a71831bfdea62',
				name: 'User2',
				userid: 'userid2On3Kv',
				password: '*****',
				organizationId: '56d95e3a999a71831bfdea60',
				created: 1457086010355,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086010780,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'user1.jpg',
						size: 36023,
						mimeType: 'image/png',
						nameOnServer: 'NTKiNzll6pCsEZUqba3LTD5MFk8i7Uk2'
					},
					picture: {
						originalName: 'user1.jpg',
						size: 36023,
						mimeType: 'image/png',
						nameOnServer: 'ZKQgT2fJ6RPOSz34qKyX7FDPKiqJfeWo'
					}
				}
			}, {
				_id: '56d95e3a999a71831bfdea63',
				name: 'User3',
				userid: 'userid3FUG8n',
				password: '*****',
				organizationId: '56d95e3a999a71831bfdea60',
				created: 1457086010360,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086010782,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'user2.jpg',
						size: 53586,
						mimeType: 'image/png',
						nameOnServer: 'l7IXqnsOIMeivPZqy9k6EJH24rNDPcfs'
					},
					picture: {
						originalName: 'user2.jpg',
						size: 53586,
						mimeType: 'image/png',
						nameOnServer: 'zXJ93yHzpVFxOk7PQf8TI0WaedqaftsG'
					}
				}
			}, {
				_id: '56d95e3a999a71831bfdea64',
				name: 'User4',
				userid: 'userid4A3ZDS',
				password: '*****',
				organizationId: '56d95e3a999a71831bfdea60',
				created: 1457086010364,
				status: 1,
				__v: 0,
				tokenGeneratedAt: 1457086010786,
				token: '*****',
				description: null,
				departments: [],
				groups: [],
				avatar: {
					thumbnail: {
						originalName: 'user3.png',
						size: 54101,
						mimeType: 'image/png',
						nameOnServer: 'oH2CJguUIe4FlOVtbnKnQghLPkf4ojE1'
					},
					picture: {
						originalName: 'user3.png',
						size: 54101,
						mimeType: 'image/png',
						nameOnServer: 'JNOtph4podh3DZjMRq5eT4iOaQEdIN8v'
					}
				}
			}]
    }],
		count: 4
	}
}

**/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const result = await searchGroup(request.user, "", 0);

    Base.successResponse(response, Const.responsecodeSucceed, {
      list: result.list,
      count: result.count,
    });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "GroupListController - GET", error);
    return;
  }
});

router.get("/:page", auth({ allowUser: true }), async function (request, response) {
  try {
    let page = 0;
    if (request.params.page) {
      page = +request.params.page - 1;
    }

    const result = await searchGroup(request.user, "", page);

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
