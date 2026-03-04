"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { Sticker, Organization } = require("#models");

/**
     * @api {get} /api/v2/stickers Sticker List
     * @apiName StickerList
     * @apiGroup WebAPI
     * @apiDescription Returns list of stickers
     * @apiSuccessExample Success-Response:
{
	"code": 1,
	"time": 1458594799210,
	"data": {
		"stickers": [{
			"name": "sticker1",
			"list": [{
				"fullPic": "/api/v2/sticker/M7mlnDGKvZwbpTdtUYJfAQkx87Sqq2jk",
				"smallPic": "/api/v2/sticker/RQId55OV5rAA5PDSXehKkmfvu1yBVtfm"
			}, {
				"fullPic": "/api/v2/sticker/IAy3Fsm5Ldp0iUYpnhalFZE96bzCG89C",
				"smallPic": "/api/v2/sticker/y1tAUeqrSnHbLiEIxzOnY5L9ycX2pb4J"
			}, {
				"fullPic": "/api/v2/sticker/MT2ZS0yfcD4ANykJGmgZsCvbk4r3GavX",
				"smallPic": "/api/v2/sticker/eoVFhVw00wgV7tlZBD1qWCtCJltTyHI9"
			}],
			"mainTitlePic": "/api/v2/sticker/y1tAUeqrSnHbLiEIxzOnY5L9ycX2pb4J"
		}, {
			"name": "sticker2",
			"list": [{
				"fullPic": "/api/v2/sticker/crbsy6L64dMH2sqQ2Dwajowc7iVXd4S4",
				"smallPic": "/api/v2/sticker/bGIzNJ3618UmpKtFKM3HoYA43VM4afTQ"
			}, {
				"fullPic": "/api/v2/sticker/faSBTStGxeiSR8ojFXxbK9mZIiE4nFhO",
				"smallPic": "/api/v2/sticker/9A98VuyQavssHEFAY872efM9JHFqfm9L"
			}, {
				"fullPic": "/api/v2/sticker/eAmxxxQVuxWANxHnfs9vht0wqLJgX7na",
				"smallPic": "/api/v2/sticker/Yxv63CSDwHTK6lSOqdPMztQWePdxCt2j"
			}],
			"mainTitlePic": "/api/v2/sticker/bGIzNJ3618UmpKtFKM3HoYA43VM4afTQ"
		}]
	}
}

**/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const organizationId = request.user.organizationId;

    const org = await Organization.findById(organizationId);
    if (!org) {
      return Base.successResponse(response, Const.responsecodeStickersWrongOrganizationId);
    }

    const stickers = await Sticker.find({
      $or: [{ organizationId: organizationId }, { organizationId: { $exists: false } }],
    }).lean();

    const formatted = stickers.map((s) => {
      let titleThumb = "";

      const pictures = s.pictures.map((p) => {
        if (p.main) titleThumb = "/api/v2/sticker/" + p.thumbnail.nameOnServer;

        return {
          fullPic: "/api/v2/sticker/" + p.picture.nameOnServer,
          smallPic: "/api/v2/sticker/" + p.thumbnail.nameOnServer,
        };
      });

      return {
        name: s.name,
        list: pictures,
        mainTitlePic: titleThumb,
      };
    });

    Base.successResponse(response, Const.responsecodeSucceed, { stickers: formatted });
    return;
  } catch (error) {
    console.log("StickersController critical err", err);
    Base.errorResponse(response, Const.httpCodeServerError);
    return;
  }
});

module.exports = router;
