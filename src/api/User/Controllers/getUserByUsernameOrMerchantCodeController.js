"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { User } = require("#models");
const { formatUserDetailsResponse } = require("#logics");

/**
 * @api {get} /api/v2/user/username-or-merchant-code Get user by username or merchant code
 * @apiName  Get user by username or merchant code
 * @apiGroup WebAPI
 * @apiDescription  Get user by username or merchant code
 *
 *
 * @apiParam [String] searchTerm searchTerm
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1669711559382,
 *     "data": {
 *         "_id": "600fdf1bae7801597aea611d",
 *         "token": [
 *             {
 *                 "token": "*****",
 *                 "generateAt": 1669704571820,
 *                 "isWebClient": false
 *             }
 *         ],
 *         "pushToken": [
 *             "0fe472934a6608def46a93aff7518f5c3021bf153e0043ac8313567f3973ba63"
 *         ],
 *         "webPushSubscription": [],
 *         "voipPushToken": [
 *             "d165b1449c4d6705d52c4e26c7980d5fe1e09033e1e9bc03a77e515560d9c89e"
 *         ],
 *         "groups": [
 *             "5caf311bec0abb18999bd755"
 *         ],
 *         "muted": [],
 *         "blocked": [],
 *         "devices": [],
 *         "UUID": [
 *             {
 *                 "UUID": "11EDBB65-0689-4421-9D0E-B0E0682AC664",
 *                 "lastLogin": 1669704571820,
 *                 "blocked": null,
 *                 "lastToken": [
 *                     {
 *                         "token": "*****",
 *                         "generateAt": 1669642496143,
 *                         "isWebClient": false
 *                     }
 *                 ],
 *                 "pushTokens": [
 *                     "temp",
 *                     "d165b1449c4d6705d52c4e26c7980d5fe1e09033e1e9bc03a77e515560d9c89e",
 *                     "0fe472934a6608def46a93aff7518f5c3021bf153e0043ac8313567f3973ba63"
 *                 ],
 *                 "lastUpdate": 1669704574103
 *             }
 *         ],
 *         "bankAccounts": [
 *             {
 *                 "_id": "6385ab7b11ad343300bd923c",
 *                 "merchantCode": "40200168",
 *                 "name": "SampleAcc",
 *                 "accountNumber": "1503567574679",
 *                 "code": "",
 *                 "selected": true
 *             }
 *         ],
 *         "location": {
 *             "type": "Point",
 *             "coordinates": [
 *                 0,
 *                 0
 *             ]
 *         },
 *         "isAppUser": true,
 *         "flomSupportAgentId": null,
 *         "newUserNotificationSent": true,
 *         "followedBusinesses": [
 *             "6101140dcbf8f756d06168fd",
 *             "60e4384b560d1466637e3eca",
 *             "61e690f745760d707bd9e493",
 *             "63073d3f54a98246b2ce1c2d"
 *         ],
 *         "likedProducts": [
 *             "61454ebe34b81213a5080abd",
 *             "6139e5a948c6c40f4dffb05d",
 *             "611fffcc48c6c40f4dffb001",
 *             "611a5bf38ead66490ae868f4",
 *             "6103ad24653cc60aa1fb0208",
 *             "61c322d463304f2aab885e0c",
 *             "6103aa69653cc60aa1fb01d6",
 *             "622890e330557e3276c4ed61",
 *             "628760500f076b6aeb83e956"
 *         ],
 *         "createdBusinessInFlom": false,
 *         "onAnotherDevice": true,
 *         "shadow": false,
 *         "name": "mer18vvii",
 *         "organizationId": "5caf3119ec0abb18999bd753",
 *         "status": 1,
 *         "created": 1611652891503,
 *         "phoneNumber": "+2348020000018",
 *         "userName": "mer18vvii",
 *         "__v": 85,
 *         "blockedProducts": 0,
 *         "activationCode": null,
 *         "invitationUri": "https://qrios.page.link/WHRajyYzLrfFCv9W9",
 *         "featuredProductTypes": [],
 *         "memberships": [],
 *         "recentlyViewedProducts": [
 *             "635ba91e1aadd47c50dc772c",
 *             "5f294fcd18f352279ef2a7e8",
 *             "61c434eae0de7f094024d3f3",
 *             "62cd6d7baa46e705938f0403",
 *             "626b8752db96f753de63fc1e",
 *             "633d292516837205ee8bf699",
 *             "629720f48eca8a440d43d5d6",
 *             "6271342af560ae2b30f91743",
 *             "61e691d045760d707bd9e4aa",
 *             "625e93eaca33ed174fcd5136"
 *         ],
 *         "socialMedia": [],
 *         "typeAcc": 1,
 *         "cover": {
 *             "banner": {
 *                 "file": {
 *                     "originalName": "1 874.png",
 *                     "nameOnServer": "defaultBanner",
 *                     "size": 70369,
 *                     "mimeType": "image/png",
 *                     "aspectRatio": 3.13044
 *                 },
 *                 "fileType": 0,
 *                 "thumb": {
 *                     "originalName": "1 874.png",
 *                     "nameOnServer": "defaultBannerThumb",
 *                     "mimeType": "image/jpeg",
 *                     "size": 174000
 *                 }
 *             }
 *         },
 *         "isCreator": true,
 *         "isSeller": true,
 *         "notifications": {
 *             "timestamp": 1664959232727,
 *             "unreadCount": 26
 *         },
 *         "businessCategory": {
 *             "_id": "5ca44ced08f8045e4e3471db",
 *             "name": "Business services"
 *         },
 *         "categoryBusinessId": "5ca44ced08f8045e4e3471db",
 *         "avatar": {
 *             "picture": {
 *                 "originalName": "imageA_1646825024.jpg",
 *                 "size": 837690,
 *                 "mimeType": "image/png",
 *                 "nameOnServer": "YTylwxV0R9zS9yzNO64dk3tDL6ndfO4F"
 *             },
 *             "thumbnail": {
 *                 "originalName": "imageA_1646825024.jpg",
 *                 "size": 112000,
 *                 "mimeType": "image/png",
 *                 "nameOnServer": "1k9jjtfJDILqlmWqO3FQgaNpdYj3q8dX"
 *             }
 *         },
 *         "workingHours": {
 *             "start": "6",
 *             "end": "13"
 *         },
 *         "email": "amper.sand@yahoo.com",
 *         "phoneNumberStatus": 1,
 *         "paymentProfileId": "905784969",
 *         "payoutFrequency": 5,
 *         "isDeleted": {
 *             "value": false,
 *             "created": 1660290163936
 *         },
 *         "locationVisibility": false,
 *         "groupModels": [
 *             {
 *                 "_id": "5caf311bec0abb18999bd755",
 *                 "users": [
 *                     "5caf311aec0abb18999bd754"
 *                 ],
 *                 "name": "Top",
 *                 "sortName": "top",
 *                 "description": "",
 *                 "created": 1554985243743,
 *                 "organizationId": "5caf3119ec0abb18999bd753",
 *                 "parentId": "",
 *                 "type": 2,
 *                 "default": true,
 *                 "__v": 0
 *             }
 *         ],
 *         "organization": {
 *             "_id": "5caf3119ec0abb18999bd753",
 *             "name": "flomorg",
 *             "organizationId": "flomorg"
 *         },
 *         "onlineStatus": null,
 *         "productsCount": 5,
 *         "soldProductsCount": 1,
 *         "subscribersCount": 0,
 *         "creatorMemberships": [
 *             {
 *                 "_id": "62bb0583571d7e596223f18b",
 *                 "recurringPaymentType": 1,
 *                 "benefits": [
 *                     {
 *                         "type": 1,
 *                         "title": "Group chat",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 2,
 *                         "title": "Private messaging",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 3,
 *                         "title": "Video call",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 4,
 *                         "title": "Audio call",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 5,
 *                         "title": "Content description",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 6,
 *                         "title": "Go live",
 *                         "enabled": true
 *                     }
 *                 ],
 *                 "image": {
 *                     "originalName": "FUOzlMXAXiWdR0zO_1656424.269866.jpg",
 *                     "size": 1173630,
 *                     "mimeType": "image/jpeg",
 *                     "nameOnServer": "upload_04425ce00b584077adfe62bc44b20df6",
 *                     "link": "/shared/Roja_Server/public/uploads/upload_04425ce00b584077adfe62bc44b20df6",
 *                     "thumbnailName": "thumb_04425ce00b584077adfe62bc44b20df6"
 *                 },
 *                 "created": 1656423811578,
 *                 "deleted": false,
 *                 "name": "nikaaa",
 *                 "amount": 99,
 *                 "description": "Jssjdj",
 *                 "order": 1,
 *                 "creatorId": "600fdf1bae7801597aea611d",
 *                 "__v": 0
 *             },
 *             {
 *                 "_id": "62bb059c571d7e596223f18c",
 *                 "recurringPaymentType": 1,
 *                 "benefits": [
 *                     {
 *                         "type": 1,
 *                         "title": "Group chat",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 2,
 *                         "title": "Private messaging",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 3,
 *                         "title": "Video call",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 4,
 *                         "title": "Audio call",
 *                         "enabled": true
 *                     },
 *                     {
 *                         "type": 5,
 *                         "title": "Content description",
 *                         "enabled": false
 *                     },
 *                     {
 *                         "type": 6,
 *                         "title": "Go live",
 *                         "enabled": false
 *                     }
 *                 ],
 *                 "image": {
 *                     "originalName": "pv9XIcSvZpT87gsN_1656423.835706.jpg",
 *                     "size": 1087060,
 *                     "mimeType": "image/jpeg",
 *                     "nameOnServer": "upload_efdfa9f3302e63b261e346fc6bd29cf8",
 *                     "link": "/shared/Roja_Server/public/uploads/upload_efdfa9f3302e63b261e346fc6bd29cf8",
 *                     "thumbnailName": "thumb_efdfa9f3302e63b261e346fc6bd29cf8"
 *                 },
 *                 "created": 1656423836553,
 *                 "deleted": false,
 *                 "name": "order 2",
 *                 "amount": 67,
 *                 "description": "Dkkdkd",
 *                 "order": 2,
 *                 "creatorId": "600fdf1bae7801597aea611d",
 *                 "__v": 0
 *             }
 *         ],
 *         "membersCount": 0
 *     }
 * }
 **/

router.get("/:searchTerm", async (request, response) => {
  try {
    const IP = request.ip || request.headers["x-forwarded-for"];
    console.log("api/v2/user/username-or-merchant-code called from IP:", IP);

    if (!request.params.searchTerm) {
      return Base.successResponse(response, Const.responsecodeNoMerchantCode);
    }

    let { searchTerm } = request.params;
    searchTerm = searchTerm.startsWith("*") ? searchTerm.slice(1) : searchTerm;
    const numberReqExp = RegExp("^[0-9]*$");
    const isMerchantCode = numberReqExp.test(searchTerm) && searchTerm.length === 8;
    const userNameRegex = new RegExp(`^${searchTerm}$`, "i");
    const query = {
      "isDeleted.value": false,
      ...(isMerchantCode
        ? { "bankAccounts.merchantCode": searchTerm }
        : { userName: userNameRegex }),
    };

    const user = await User.findOne(query).lean();
    if (!user) {
      return Base.successResponse(response, Const.responsecodeSucceed, {});
    }
    if (user?.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    await formatUserDetailsResponse({
      user,
      requestAccessToken: request.headers["access-token"],
    });

    return Base.successResponse(response, Const.responsecodeSucceed, user);
  } catch (error) {
    return Base.errorResponse(
      response,
      Const.httpCodeServerError,
      "getUserByUsernameMerchantCodeController",
      error,
    );
  }
});

module.exports = router;
