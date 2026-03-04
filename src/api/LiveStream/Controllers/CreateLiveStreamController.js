"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, Membership, Tribe, Product, User } = require("#models");
const { handleTags, formatLiveStreamResponse } = require("#logics");
const { isLanguageValid } = require("../helpers");
const { recombee } = require("#services");

/**
 * @api {post} /api/v2/livestreams Create live stream flom_v1
 * @apiVersion 2.0.19
 * @apiName  Create live stream flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Create live stream
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}    name                    Name of live stream
 * @apiParam {String}    type                    Stream type ("live", "event", "market")
 * @apiParam {String}    visibility              Visibility of stream ("public", "tribes", "community")
 * @apiParam {String}    [tribeIds]              List of tribe ids for which the stream is visible (comma-separated string) (only send if visibility is "tribes")
 * @apiParam {String}    [communityIds]          List of community ids for which the stream is visible (comma-separated string) (only send if visibility is "community")
 * @apiParam {String[]}  [linkedProductIds]      Only for type "market", ids of products to be presented (required!)
 * @apiParam {String}    [activeProductId]       Only for type "market", id of active product, must be one of linkedProductIds (required!)
 * @apiParam {String}    [tags]                  Tags (single space-separated string, e.g. "kitchen goodfood garlic")
 * @apiParam {String}    [cohosts]               Array of user ids (maximum: 4)
 * @apiParam {Boolean}   [allowComments]         Allow comments on stream (default: false)
 * @apiParam {Boolean}   [allowSuperBless]       Allow Super Bless transfer on stream (default: false)
 * @apiParam {Boolean}   [allowSprayBless]       Allow Spray Bless transfer on stream (default: false)
 * @apiParam {Boolean}   [appropriateForKids]    Mark stream as appropriate for kids (default: false)
 * @apiParam {String}    [language]              Language of the stream (e.g. "en", "fr", "de") default: "en"
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {
 *         "liveStream": {
 *             "_id": "65fbf300637fa90fc8b3fe1e",
 *             "tribeIds": [],
 *             "communityIds": [],
 *             "totalNumberOfViews": 0,
 *             "created": 1711010560536,
 *             "userId": "63ebd90e3ad20c240227fc9d",
 *             "name": "Pero's first stream",
 *             "type": "market",
 *             "linkedProductIds": [String, String],
 *             "activeProductId": String,
 *             "visibility": "public",
 *             "__v": 0,
 *             "modified": 1711010657475,
 *             "tags": "kitchen goodfood garlic",
 *             "tagIds": ["tag_id_1", "tag_id_2", "tag_id_3"],
 *             "allowComments": true,
 *             "allowSuperBless": false,
 *             "allowSprayBless": false,
 *             "cohosts": [
 *                 {
 *                     "_id": "63dcc7f3bcc5921af87df5c2",
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "40200168",
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE5XQERQVP3XCUQXZ6U2G"
 *                         }
 *                     ],
 *                     "created": 1675413491799,
 *                     "phoneNumber": "+2348020000004",
 *                     "userName": "marko_04",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "IMAGE_20230210_114832.jpg",
 *                             "size": 71831,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "9LAr5TWlzCGxSeomwLEd3VR7YdiCZ14H"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "IMAGE_20230210_114832.jpg",
 *                             "size": 59100,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "PM4qH75xRcMMcfgKo9kwLtH5UPs5FE0g"
 *                         }
 *                     }
 *                 }
 *             ],
 *             "user": {
 *                 "_id": "63ebd90e3ad20c240227fc9d",
 *                 "created": 1675671804461,
 *                 "phoneNumber": "+2348037164622",
 *                 "userName": "mosh",
 *                 "avatar": {
 *                     "picture": {
 *                         "originalName": "IMAGE_20230210_114832.jpg",
 *                         "size": 71831,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "9LAr5TWlzCGxSeomwLEd3VR7YdiCZ14H"
 *                     },
 *                     "thumbnail": {
 *                         "originalName": "IMAGE_20230210_114832.jpg",
 *                         "size": 59100,
 *                         "mimeType": "image/png",
 *                         "nameOnServer": "PM4qH75xRcMMcfgKo9kwLtH5UPs5FE0g"
 *                     }
 *                 },
 *                 "bankAccounts": [
 *                     {
 *                         "merchantCode": "89440483",
 *                         "businessName": "DIGITAL",
 *                         "name": "DIGITAL",
 *                         "bankName": "FBN MOBILE",
 *                         "code": "309",
 *                         "accountNumber": "jgrdguhfbtf",
 *                         "selected": true,
 *                         "lightningUserName": "89440483",
 *                         "lightningAddress": "89440483@v2.flom.dev",
 *                         "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP58QESA403RS"
 *                     },
 *                     {
 *                         "merchantCode": "89440477",
 *                         "businessName": null,
 *                         "name": null,
 *                         "bankName": "FBN",
 *                         "code": "011",
 *                         "accountNumber": null,
 *                         "selected": false,
 *                         "lightningUserName": "89440477",
 *                         "lightningAddress": "89440477@v2.flom.dev",
 *                         "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTEC8Y6RGVP5XUMSRMD43Z"
 *                     }
 *                 ]
 *             }
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
 * @apiError (Errors) 443929 User is blocked from creating live streams
 * @apiError (Errors) 443856 Invalid name
 * @apiError (Errors) 443226 Invalid live stream type
 * @apiError (Errors) 443228 Invalid visibility
 * @apiError (Errors) 443859 Invalid community ids parameter
 * @apiError (Errors) 443240 Invalid membership id
 * @apiError (Errors) 443860 Invalid tribe ids parameter
 * @apiError (Errors) 443861 Invalid tribe id
 * @apiError (Errors) 443241 Membership not found
 * @apiError (Errors) 443474 Tribe not found
 * @apiError (Errors) 400310 Missing linked product ids
 * @apiError (Errors) 443225 Invalid linked product id
 * @apiError (Errors) 400163 Linked product not found
 * @apiError (Errors) 443858 User not allowed
 * @apiError (Errors) 443866 Invalid tags parameter
 * @apiError (Errors) 443867 Invalid allowComments parameter
 * @apiError (Errors) 443868 Invalid allowSuperBless parameter
 * @apiError (Errors) 443869 Invalid allowSprayBless parameter
 * @apiError (Errors) 443870 Invalid cohost id
 * @apiError (Errors) 443871 Cohost not found
 * @apiError (Errors) 443872 Too many cohosts
 * @apiError (Errors) 443900 User is underage
 * @apiError (Errors) 430580 User is not merchant
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const {
      name,
      type,
      visibility,
      communityIds,
      tribeIds,
      linkedProductIds,
      activeProductId,
      tags: tagsFromInput,
      cohosts,
      allowComments,
      allowSuperBless,
      allowSprayBless,
      appropriateForKids = false,
    } = request.body;
    const userId = user._id.toString();
    user._id = user._id.toString();
    const language = isLanguageValid(request.body.language) ? request.body.language : "en";

    const { blockedFromCreatingLiveStreams = false } = user;
    if (blockedFromCreatingLiveStreams) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserIsBlockedFromCreatingLiveStreams,
        message: "CreateLiveStreamController, user is blocked from creating live streams",
      });
    }

    if (Utils.yearsFromBirthDate(user.dateOfBirth) < 18) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserIsUnderage,
        message: "CreateLiveStreamController, user is underage",
      });
    }

    if (!user.bankAccounts || user.bankAccounts.length === 0) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNotMerchantAccount,
        message: "CreateLiveStreamController, user is not merchant",
      });
    }

    if (!name || typeof name !== "string") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidName,
        message: "CreateLiveStreamController, invalid name",
      });
    }

    if (!type || !Const.liveStreamTypes.includes(type)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTypeParameter,
        message: "CreateLiveStreamController, invalid type",
      });
    }

    let linkedProductTags = [],
      linkedProductTagIds = [];

    if (type === "market") {
      if (!linkedProductIds || !Array.isArray(linkedProductIds) || linkedProductIds.length === 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoProductId,
          message: "CreateLiveStreamController, linkedProductIds array missing or empty",
        });
      }

      for (const id of linkedProductIds) {
        if (!Utils.isValidObjectId(id)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidProductId,
            message: "CreateLiveStreamController, invalid linked product id: " + id,
          });
        }

        const linkedProduct = await Product.findById(id).lean();

        if (!linkedProduct) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeLinkedProductNotFound,
            message: "CreateLiveStreamController, linked product not found: " + id,
          });
        }

        if (linkedProduct.tags) {
          linkedProductTags.push(linkedProduct.tags.trim());
          linkedProductTagIds = linkedProductTagIds.concat(linkedProduct.tagIds ?? []);
        }
      }
      linkedProductTags = linkedProductTags.join(" ");

      if (!activeProductId) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoProductId,
          message: "CreateLiveStreamController, active product id missing",
        });
      }

      if (!linkedProductIds.includes(activeProductId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProductId,
          message:
            "CreateLiveStreamController, invalid active product id, not in linked: " +
            activeProductId,
        });
      }
    }

    let communityIdsArray, tribeIdsArray;

    if (!["public", "tribes", "community"].includes(visibility)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongVisibilityParameter,
        message: "CreateLiveStreamController, invalid visibility",
      });
    }

    if (visibility === "community") {
      if (!communityIds || (communityIds && typeof communityIds !== "string")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCommunityIdsParam,
          message: "CreateLiveStreamController, invalid communityIds parameter",
        });
      }

      communityIdsArray = communityIds.split(",");

      for (const id of communityIdsArray) {
        if (!Utils.isValidObjectId(id)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidMembershipId,
            message: `CreateLiveStreamController, invalid membershipId: ${id}`,
          });
        }

        const membership = await Membership.findById(id);

        if (!membership) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeMembershipNotFound,
            message: `CreateLiveStreamController, membership ${id} not found`,
          });
        }

        let isMemberOrCreator = false;

        if (userId === membership.creatorId) isMemberOrCreator = true;

        for (const userMembership of user.memberships) {
          if (
            userMembership.id === id &&
            (userMembership.expirationDate === -1 || userMembership.expirationDate < Date.now())
          )
            isMemberOrCreator = true;
        }

        if (!isMemberOrCreator) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeUserNotAllowed,
            message: `CreateLiveStreamController, user is not a member or creator of membership: ${id}`,
          });
        }
      }
    }

    if (visibility === "tribes") {
      if (!tribeIds || (tribeIds && typeof tribeIds !== "string")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTribeIdsParam,
          message: "CreateLiveStreamController, invalid tribeIds parameter",
        });
      }

      tribeIdsArray = tribeIds.split(",");

      for (const id of tribeIdsArray) {
        if (!Utils.isValidObjectId(id)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTribeId,
            message: `CreateLiveStreamController, invalid tribeId: ${id}`,
          });
        }

        const tribe = await Tribe.findById(id);

        if (!tribe) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTribeNotFound,
            message: `CreateLiveStreamController, tribe ${id} not found`,
          });
        }

        let isMemberOrOwner = false;

        if (tribe.ownerId === userId) {
          isMemberOrOwner = true;
        }

        const tribeMembers = tribe.members?.accepted ?? [];
        for (const member of tribeMembers) {
          if (member.role > Const.tribeMemberRoleMember && member.id === userId) {
            isMemberOrOwner = true;
          }
        }

        if (!isMemberOrOwner) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeUserNotAllowed,
            message: `CreateLiveStreamController, user is not a member (elder+) or owner of tribe: ${id}`,
          });
        }
      }
    }

    let tags, tagIds;
    if (tagsFromInput) {
      if (typeof tagsFromInput !== "string") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTagsParam,
          message: "CreateLiveStreamController, invalid tags",
        });
      }

      const { tags: t, tagIds: i } = await handleTags({ newTags: tagsFromInput });
      tags = t;
      tagIds = i;
    }

    if (cohosts && Array.isArray(cohosts) && cohosts.length > 0) {
      if (type !== "event") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: "CreateLiveStreamController, only type 'event' can have cohosts",
        });
      }

      if (cohosts.length > Const.maxLiveStreamCohosts) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTooManyCohosts,
          message: "CreateLiveStreamController, too many cohosts",
        });
      }

      for (const cohostId of cohosts) {
        if (!Utils.isValidObjectId(cohostId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCohostId,
            message: `CreateLiveStreamController, invalid cohost id: ${cohostId}`,
          });
        }

        const cohost = await User.findById(cohostId, { isDeleted: 1 }).lean();

        if (!cohost || cohost?.isDeleted?.value === true) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCohostNotFound,
            message: `CreateLiveStreamController, cohost ${cohostId} not found`,
          });
        }
      }
    }

    if (allowComments !== undefined && typeof allowComments !== "boolean") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAllowCommentsParam,
        message: "CreateLiveStreamController, invalid allowComments param",
      });
    }
    if (allowSuperBless !== undefined && typeof allowSuperBless !== "boolean") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAllowSuperBlessParam,
        message: "CreateLiveStreamController, invalid allowSuperBless param",
      });
    }
    if (allowSprayBless !== undefined && typeof allowSprayBless !== "boolean") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidAllowSprayBlessParam,
        message: "CreateLiveStreamController, invalid allowSprayBless param",
      });
    }

    const liveStream = await LiveStream.create({
      userId,
      name,
      type,
      visibility,
      communityIds: communityIdsArray,
      tribeIds: tribeIdsArray,
      linkedProductIds: type === "market" ? linkedProductIds : undefined,
      activeProductId,
      tags,
      tagIds,
      linkedProductTags,
      linkedProductTagIds,
      cohosts,
      allowComments,
      allowSuperBless,
      allowSprayBless,
      domain: "antmedia.flom.app",
      ...(typeof appropriateForKids === "boolean" ? { appropriateForKids } : {}),
      language,
    });

    const stream = liveStream.toObject();
    await formatLiveStreamResponse({ liveStream: stream });

    const responseData = { liveStream: stream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      await recombee.upsertLiveStream({
        liveStream: stream,
        userCountryCode: user.countryCode,
        userLocation: user.location,
      });
    } catch (error) {
      logger.error("CreateLiveStreamController, recombee error: ", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CreateLiveStreamController",
      error,
    });
  }
});

module.exports = router;
