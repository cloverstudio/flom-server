"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { FlomMessage, Favorite } = require("#models");
const { populateMessages } = require("#logics");

/**
     * @api {get} /api/v2/message/favorite/list/:page FavoriteList
     * @apiName FavoriteList
     * @apiGroup WebAPI
     * @apiDescription Returns list of favorites
     * @apiHeader {String} access-token Users unique access-token.
     * @apiSuccessExample Success-Response:

{
	"code": 1,
	"time": 1457364665523,
	"data": {
		"favorites": [{
			"_id": "56dd9b986aefa87d526cdf98",
			"userId": "56c32acd331dd81f8134f200",
			"messageId": "56cc6d880675f1d00532628f",
			"created": 1457363864235,
			"__v": 0,
			"Message": {
				"_id": "56cc6d880675f1d00532628f",
				"user": "56c32ae5331dd81f8134f201",
				"userID": "56c32acd331dd81f8134f200",
				"roomID": "1-56c32acd331dd81f8134f200-56c32bf6db88293409a20299",
				"message": "aa",
				"localID": "_fOpZHNDZiuPl8lN0btUfPbS54dQ6Vui8",
				"type": 1,
				"created": 1456237960593,
				"__v": 0,
				"seenBy": [],
				"User": {
					"_id": "56c32acd331dd81f8134f200",
					"name": "Ken",
					"sortName": "ken yasue",
					"description": "ああああ",
					"userid": "kenyasue",
					"password": "*****",
					"created": 1455631053660,
					"status": 1,
					"organizationId": "56ab7b9061b760d9eb6feba3",
					"__v": 0,
					"tokenGeneratedAt": 1457362952304,
					"token": "*****",
					"groups": ["56cf0a60ed51d2905e28a848", "56cf0897ed51d2905e28a726"],
					"avatar": {
						"thumbnail": {
							"originalName": "2015-01-11 21.30.05 HDR.jpg",
							"size": 1551587,
							"mimeType": "image/png",
							"nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
						},
						"picture": {
							"originalName": "2015-01-11 21.30.05 HDR.jpg",
							"size": 1551587,
							"mimeType": "image/png",
							"nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
						}
					}
				},
                "userModelTarget": {
                    "_id": "56c32acd331dd81f8134f200",
                    "name": "Ken",
                    "sortName": "ken yasue",
                    "description": "ああああ",
                    "userid": "kenyasue",
                    "password": "*****",
                    "created": 1455631053660,
                    "status": 1,
                    "organizationId": "56ab7b9061b760d9eb6feba3",
                    "__v": 0,
                    "tokenGeneratedAt": 1457362225645,
                    "token": "*****",
                    "groups": ["56cf0a60ed51d2905e28a848", "56cf0897ed51d2905e28a726"],
                    "avatar": {
                        "thumbnail": {
                            "originalName": "2015-01-11 21.30.05 HDR.jpg",
                            "size": 1551587,
                            "mimeType": "image/png",
                            "nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
                        },
                        "picture": {
                            "originalName": "2015-01-11 21.30.05 HDR.jpg",
                            "size": 1551587,
                            "mimeType": "image/png",
                            "nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
                        }
                    }
                }
			}
		}, {
			"_id": "56dd9b659714d72f5212b904",
			"userId": "56c32acd331dd81f8134f200",
			"messageId": "56dd9522f3e5890d4700b9e5",
			"created": 1457363813665,
			"__v": 0,
			"Message": {
				"_id": "56dd9522f3e5890d4700b9e5",
				"user": "56c32ae5331dd81f8134f201",
				"userID": "56c32acd331dd81f8134f200",
				"roomID": "2-56cf082ded51d2905e28a6d4",
				"message": "zzz",
				"localID": "_z4a5fHmI2J55yOcbtmtt4MReZBiiXtD1",
				"type": 1,
				"created": 1457362210967,
				"__v": 0,
				"seenBy": [],
				"User": {
					"_id": "56c32acd331dd81f8134f200",
					"name": "Ken",
					"sortName": "ken yasue",
					"description": "ああああ",
					"userid": "kenyasue",
					"password": "*****",
					"created": 1455631053660,
					"status": 1,
					"organizationId": "56ab7b9061b760d9eb6feba3",
					"__v": 0,
					"tokenGeneratedAt": 1457362952304,
					"token": "*****",
					"groups": ["56cf0a60ed51d2905e28a848"],
					"avatar": {
						"thumbnail": {
							"originalName": "2015-01-11 21.30.05 HDR.jpg",
							"size": 1551587,
							"mimeType": "image/png",
							"nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
						},
						"picture": {
							"originalName": "2015-01-11 21.30.05 HDR.jpg",
							"size": 1551587,
							"mimeType": "image/png",
							"nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
						}
					}
				},
				"Group": {
					"_id": "56cf082ded51d2905e28a6d4",
					"organizationId": "56ab7b9061b760d9eb6feba3",
					"name": "BlogXS",
					"sortName": "BlogXS",
					"description": "lorem quisque ut erat curabitur gravida nisi at nibh in hac habitasse platea dictumst aliquam augue",
					"created": 1456408621251,
					"__v": 0,
					"users": ["56c32bdfdb88293409a20234", "56c32b79db88293409a2008b", "56c32c02db88293409a202cb", "56c32c02db88293409a202c9"],
					"avatar": {
						"thumbnail": {
							"originalName": "vAnLjyXV9FSnQo6TRDdtOUqBlMQATMXi",
							"size": 1,
							"mimeType": "image/png",
							"nameOnServer": "vAnLjyXV9FSnQo6TRDdtOUqBlMQATMXi"
						},
						"picture": {
							"originalName": "EU0IS6053tCts0Ar8sPQYPrcxtfqZPwX",
							"size": 1,
							"mimeType": "image/png",
							"nameOnServer": "EU0IS6053tCts0Ar8sPQYPrcxtfqZPwX"
						}
					}
				}
			}
		}, {
			"_id": "56dd9977ee7b28114fa651e6",
			"userId": "56c32acd331dd81f8134f200",
			"messageId": "56dd9527f3e5890d4700b9e6",
			"created": 1457363319710,
			"__v": 0,
			"Message": {
				"_id": "56dd9527f3e5890d4700b9e6",
				"user": "56c32ae5331dd81f8134f201",
				"userID": "56c32acd331dd81f8134f200",
				"roomID": "3-56d9b199cdcc4b69755a5431",
				"message": "zzz",
				"localID": "_ScfrTjXRdxjNNa3laUtclNpIKuGZggP4",
				"type": 1,
				"created": 1457362215637,
				"__v": 0,
				"seenBy": [],
				"User": {
					"_id": "56c32acd331dd81f8134f200",
					"name": "Ken",
					"sortName": "ken yasue",
					"description": "ああああ",
					"userid": "kenyasue",
					"password": "*****",
					"created": 1455631053660,
					"status": 1,
					"organizationId": "56ab7b9061b760d9eb6feba3",
					"__v": 0,
					"tokenGeneratedAt": 1457362952304,
					"token": "*****",
					"groups": ["56cf0a60ed51d2905e28a848", "56cf0897ed51d2905e28a726", "56cf08cded51d2905e28a754", "56cf092fed51d2905e28a783"],
					"avatar": {
						"thumbnail": {
							"originalName": "2015-01-11 21.30.05 HDR.jpg",
							"size": 1551587,
							"mimeType": "image/png",
							"nameOnServer": "c2gQT5IMJAYqx89eo8gwFrKJSRxlFYFU"
						},
						"picture": {
							"originalName": "2015-01-11 21.30.05 HDR.jpg",
							"size": 1551587,
							"mimeType": "image/png",
							"nameOnServer": "jf7mBTsU6CVfFPLsnY4Ijqcuo6vYTKAs"
						}
					}
				},
				"Room": {
					"_id": "56d9b199cdcc4b69755a5431",
					"owner": "56c32acd331dd81f8134f200",
					"name": "Notification Test",
					"created": 1457107353959,
					"__v": 0,
					"avatar": {
						"thumbnail": {
							"originalName": "ZrylJtaVOkhHoCiz7R1kPcuTU8mChIZe",
							"size": 118868,
							"mimeType": "image/png",
							"nameOnServer": "ZrylJtaVOkhHoCiz7R1kPcuTU8mChIZe"
						},
						"picture": {
							"originalName": "ZrylJtaVOkhHoCiz7R1kPcuTU8mChIZe",
							"size": 118868,
							"mimeType": "image/png",
							"nameOnServer": "ZrylJtaVOkhHoCiz7R1kPcuTU8mChIZe"
						}
					},
					"users": ["56c32acd331dd81f8134f200", "56d375b7b92c46fc0403a8eb"]
				}
			}
		}],
		"count": 3
	}
}


**/

router.get("/:page", auth({ allowUser: true }), async function (request, response) {
  try {
    const page = +request.params.page - 1;
    const userId = request.user._id.toString();
    const query = { userId };

    const favorites = await Favorite.find(query)
      .sort({ created: "desc" })
      .skip(Const.pagingRows * page)
      .limit(Const.pagingRows)
      .lean();

    const messageIds = favorites.map((favorite) => favorite.messageId);
    const messages = await FlomMessage.find({ _id: { $in: messageIds } }).lean();
    const populatedMessages = await populateMessages(messages, request.user);

    const messagesMap = {};
    populatedMessages.forEach((message) => {
      messagesMap[message._id.toString()] = message;
    });

    favorites.forEach((favorite) => {
      favorite.Message = messagesMap[favorite.messageId.toString()];
    });

    return Base.successResponse(response, Const.responsecodeSucceed, {
      favorites,
      count: favorites.length,
    });
  } catch (error) {
    return Base.errorResponse(response, Const.httpCodeServerError, "FavoriteListController", error);
  }
});

module.exports = router;
