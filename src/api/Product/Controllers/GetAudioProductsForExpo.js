"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Sound, User } = require("#models");

/**
 * @api {get} /api/v2/products/expo/audio Get audios for expo flom_v1
 * @apiVersion 2.0.17
 * @apiName  Get audios for expo flom_v1
 * @apiGroup WebAPI Products
 * @apiDescription  Get audios for expo.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} [search]  Title/name search term, case insensitive
 * @apiParam (Query string) {String} [type]    Type of audio (products, sounds)
 * @apiParam (Query string) {Number} [page]    Page number
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1706017507944,
 *     "data": {
 *         "audios": [
 *             {
 *                 "_id": "657ab9a6e95f411a992dd8df",
 *                 "audio": {
 *                     "originalFileName": "file_example_MP3_1MG (2).mp3",
 *                     "nameOnServer": "AZlmk260x79MoR0b1aV26FOzOc50QMj8.mp3",
 *                     "mimeType": "audio/mpeg",
 *                     "duration": 58,
 *                     "size": 1059386,
 *                     "hslName": "DFf5H4q0YZkvc89zU08RIHbLR7oHLemY"
 *                 },
 *                 "thumbnail": {
 *                     "originalFileName": "kPxhJ4rtFhJtgVftaQy5hHMfKVOsWdro.webp",
 *                     "nameOnServer": "kPxhJ4rtFhJtgVftaQy5hHMfKVOsWdro.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 8682,
 *                     "height": 600,
 *                     "width": 800,
 *                     "aspectRatio": 0.75
 *                 },
 *                 "title": "ll",
 *                 "artist": "sssss",
 *                 "duration": "58",
 *                 "created": 1702541734431,
 *                 "createdReadable": "2023-12-14T08:15:34.431Z",
 *                 "__v": 0,
 *                 "usedInExpoCount": 0
 *             },
 *             {
 *                 "_id": "63e247e494deb3742b014132",
 *                 "price": -1,
 *                 "originalPrice": {
 *                     "value": -1,
 *                     "minValue": -1,
 *                     "maxValue": -1,
 *                     "singleValue": -1,
 *                     "unlimitedValue": -1,
 *                     "exclusiveValue": -1
 *                 },
 *                 "created": 1675773924594,
 *                 "modified": 1675773924594,
 *                 "file": [
 *                     {
 *                         "file": {
 *                             "originalName": "Miles Davis - Florence sur les Champs-Élysées.mp3",
 *                             "nameOnServer": "uG5EOTeJbWkm5ipfZbAcVvNLNK0iQ4wZ.mp3",
 *                             "mimeType": "audio/mpeg",
 *                             "duration": 172.434286,
 *                             "size": 2759301,
 *                             "hslName": "sJ8EtbtmlEQmCsHzJFIOkin5iWEifC8q"
 *                         },
 *                         "_id": "63e247e494deb3742b014134",
 *                         "fileType": 2,
 *                         "order": 0
 *                     },
 *                     {
 *                         "file": {
 *                             "originalName": "IMAGE_20230207_134327.jpg",
 *                             "nameOnServer": "LQQu4O7zV8y3NEekM3MWieFBjOYTfJ4G.jpg",
 *                             "width": 1243,
 *                             "height": 1600,
 *                             "size": 293042,
 *                             "mimeType": "image/jpeg",
 *                             "aspectRatio": 0.77687
 *                         },
 *                         "thumb": {
 *                             "originalName": "IMAGE_20230207_134327.jpg",
 *                             "nameOnServer": "FltussmcfRo4JqlnBhdpPTCbJtfcZe5P.jpg",
 *                             "mimeType": "image/jpeg",
 *                             "size": 67800
 *                         },
 *                         "_id": "63e247e494deb3742b014133",
 *                         "fileType": 0,
 *                         "order": 1
 *                     }
 *                 ],
 *                 "image": [],
 *                 "isDeleted": false,
 *                 "numberOfReviews": 3,
 *                 "location": {
 *                     "coordinates": [
 *                         0,
 *                         0
 *                     ],
 *                     "type": "Point"
 *                 },
 *                 "minPrice": -1,
 *                 "maxPrice": -1,
 *                 "localPrice": {
 *                     "localMin": -1,
 *                     "localMax": -1,
 *                     "localAmount": -1,
 *                     "amount": -1,
 *                     "minAmount": -1,
 *                     "maxAmount": -1
 *                 },
 *                 "numberOfLikes": 1,
 *                 "moderation": {
 *                     "status": 3,
 *                     "comment": ""
 *                 },
 *                 "hashtags": [
 *                     "63e245e994deb3742b01411c",
 *                     "63e246ac94deb3742b014126",
 *                     "63e247e494deb3742b014131"
 *                 ],
 *                 "visibility": "public",
 *                 "tribeIds": [],
 *                 "communityIds": [],
 *                 "featured": {
 *                     "created": 1675773924594,
 *                     "isFeatured": false
 *                 },
 *                 "allowPublicComments": true,
 *                 "name": "Miles Davis: Florence sur les Champs-Élysées",
 *                 "type": 3,
 *                 "tags": "#jazz #milesdavis #louismalle",
 *                 "ownerId": "63e244b294deb3742b01410f",
 *                 "parentCategoryId": "621e9131429b8ed2839fdc30",
 *                 "categoryId": "621e92fa429b8ed2839fdc31",
 *                 "appropriateForKids": true,
 *                 "__v": 0,
 *                 "numberOfViews": 279,
 *                 "usedInExpoCount": 0,
 *                 "availableForExpo": true,
 *                 "owner": {
 *                     "id": String,
 *                     "username": String,
 *                     "name": String,
 *                     "phoneNumber": String,
 *                     "created": String,
 *                 },
 *             },
 *
 *         ],
 *         "paginationData": {
 *             "page": 1,
 *             "total": 3,
 *             "hasNext": false
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const type = request.query.type;
    const pagingRows = 20;
    const page = request.query.page ? +request.query.page : 1;
    const skip = page > 0 ? (page - 1) * pagingRows : 0;

    const productsQuery = {
      type: Const.productTypePodcast,
      isDeleted: false,
      availableForExpo: true,
      "moderation.status": Const.moderationStatusApproved,
      ownerId: { $nin: request.user?.blocked || [] },
    };
    const soundsQuery = {};

    if (request.query.search) {
      const regex = new RegExp(request.query.search, "i");
      productsQuery.name = regex;
      soundsQuery.title = regex;
    }

    const products = type === "products" || !type ? await Product.find(productsQuery).lean() : [];
    const sounds = type === "sounds" || !type ? await Sound.find(soundsQuery).lean() : [];
    const allAudios = [...products, ...sounds];
    allAudios.sort((a, b) => b.usedInExpoCount - a.usedInExpoCount || b.created - a.created);

    const filteredAudios = [];
    for (let i = 0; i < allAudios.length; i++) {
      const purchaseHistory = allAudios[i].contentPurchaseHistory || [];

      let isExclusive = false;

      purchaseHistory.forEach((purchase) => {
        if (
          purchase.purchaseType === Const.contentPurchaseTypeExclusive &&
          purchase.buyerId !== request.user._id.toString()
        ) {
          isExclusive = true;
        }
      });

      if (isExclusive) {
        continue;
      } else {
        filteredAudios.push(allAudios[i]);
      }
    }

    const total = filteredAudios.length;
    const hasNext = total > skip + pagingRows;

    const audios = filteredAudios.slice(skip, skip + pagingRows);

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    for (let i = 0; i < audios.length; i++) {
      const audio = audios[i];

      if (audio.ownerId) {
        const owner = await User.findById(audio.ownerId);
        audio.owner = {
          id: owner._id.toString(),
          userName: owner.userName,
          name: owner.name,
          phoneNumber: owner.phoneNumber,
          created: owner.created,
        };

        if (!audio.isFree) {
          Utils.addUserPriceToProduct({
            product: audio,
            userRate,
            userCountryCode,
            userCurrency,
            conversionRates,
          });
        }

        if (audio.contentPurchaseHistory && audio.contentPurchaseHistory.length > 0) {
          audio.contentPurchaseHistory = audio.contentPurchaseHistory.filter(
            (purchase) => purchase.buyerId === request.user._id.toString(),
          );
        }
      }
    }

    const responseData = { audios, paginationData: { page, total, hasNext } };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetAudioProductsForExpo",
      error,
    });
  }
});

module.exports = router;
