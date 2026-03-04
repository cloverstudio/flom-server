"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Room } = require("#models");

/**
     * @api {get} /api/v2/room/list/mine List user's room
     * @apiName List user's room
     * @apiGroup WebAPI
     * @apiDescription Returns all rooms which caller user is owner
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:
{
	code: 1,
	time: 1458829974637,
	data: {
		rooms: [{
			_id: '56f3fa956994704ec1b7fba5',
			description: 'description',
			owner: '56f3fa946994704ec1b7fb9d',
			name: 'Room1Changeg',
			created: 1458829973564,
			__v: 0,
			modified: 1458829973909,
			avatar: {
				thumbnail: {
					originalName: 'max.jpg',
					size: 64914,
					mimeType: 'image/png',
					nameOnServer: '1quUqnJh2dfSzgaMXoSpMCaQguL4mMgO'
				},
				picture: {
					originalName: 'max.jpg',
					size: 64914,
					mimeType: 'image/png',
					nameOnServer: 'KCcOhqigP4tKYyZlB0IuCCvLZztg26fZ'
				}
			},
			users: ['56f3fa946994704ec1b7fb9d',
				'56f3fa946994704ec1b7fb9e',
				'56f3fa946994704ec1b7fb9f'
			]
		}]
	}
}

**/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const rooms = await Room.find({ owner: request.user._id.toString() }).lean();

    return Base.successResponse(response, Const.responsecodeSucceed, { rooms });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "RoomListMine", error);
  }
});

module.exports = router;
