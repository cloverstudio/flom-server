"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { LiveStream, User, Membership, Tribe, Notification, Product } = require("#models");
const { socketApi } = require("#sockets");
const { handleTags, formatLiveStreamResponse } = require("#logics");
const { recombee } = require("#services");
const { isLanguageValid } = require("../helpers");

/**
 * @api {patch} /api/v2/livestreams/:id Update live stream flom_v1
 * @apiVersion 2.0.19
 * @apiName  Update live stream flom_v1
 * @apiGroup WebAPI Live Stream
 * @apiDescription  Update live stream
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}    [streamId]              Antmedia stream id
 * @apiParam {Number}    [startTimeStamp]        Start time in milliseconds from 1970-01-01, UTC
 * @apiParam {Number}    [endTimeStamp]          Stop time in milliseconds from 1970-01-01, UTC
 * @apiParam {String}    [visibility]            Visibility of stream ("public", "tribes", "community")
 * @apiParam {String}    [tribeIds]              List of tribe ids for which the stream is visible (comma-separated string) (only send if visibility is "tribes")
 * @apiParam {String}    [communityIds]          List of community ids for which the stream is visible (comma-separated string) (only send if visibility is "community")
 * @apiParam {String[]}  [linkedProductIds]      Only for type "market", ids of products to be presented
 * @apiParam {String}    [activeProductId]       Only for type "market", id of active product, must be one of stream linked product ids
 * @apiParam {String}    [tags]                  Tags (single space-separated string, e.g. "kitchen goodfood garlic")
 * @apiParam {String}    [cohosts]               Array of user ids (maximum: 4)
 * @apiParam {Boolean}   [allowComments]         Allow comments on stream
 * @apiParam {Boolean}   [allowSuperBless]       Allow Super Bless transfer on stream
 * @apiParam {Boolean}   [allowSprayBless]       Allow Spray Bless transfer on stream
 * @apiParam {Boolean}   [appropriateForKids]    Mark stream as appropriate for kids (default: false)
 * @apiParam {Boolean}   [deleteComments]        If true deletes comments on stream from database
 * @apiParam {Object[]}  [camerasToAdd]            Array of stream objects with new cameras for streamer
 * @apiParam {String}    [camerasToAdd.streamId]   Stream ID
 * @apiParam {String[]}  [camerasToRemove]       Array of stream ids to be removed for streamer
 * @apiParam {String}    [language]              Language of the stream (e.g. "en", "fr", "de") default: "en"
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1711010802918,
 *     "data": {
 *         "updatedLiveStream": {
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
 *             "streamId": "fakestreamid1234",
 *             "tags": "kitchen goodfood garlic",
 *             "tagIds": ["tag_id_1", "tag_id_2", "tag_id_3"],
 *             "allowComments": true,
 *             "allowSuperBless": false,
 *             "allowSprayBless": false,
 *             "additionalCameras": [
 *                 {
 *                     "streamId": "streamId"
 *                 }
 *             ],
 *             "additionalCohostCameras": [
 *                 {
 *                     "streamId": "streamId",
 *                     "cohostId": "cohostId"
 *                 }
 *             ],
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
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443858 User not stream owner
 * @apiError (Errors) 443857 Invalid timestamp
 * @apiError (Errors) 443228 Invalid visibility
 * @apiError (Errors) 443859 Invalid membership ids parameter
 * @apiError (Errors) 443240 Invalid membership id
 * @apiError (Errors) 443860 Invalid tribe ids parameter
 * @apiError (Errors) 443861 Invalid tribe id
 * @apiError (Errors) 443241 Membership not found
 * @apiError (Errors) 443474 Tribe not found
 * @apiError (Errors) 400310 Missing linked product ids
 * @apiError (Errors) 443225 Invalid linked product id
 * @apiError (Errors) 400163 Linked product not found
 * @apiError (Errors) 443866 Invalid tags parameter
 * @apiError (Errors) 443867 Invalid allowComments parameter
 * @apiError (Errors) 443868 Invalid allowSuperBless parameter
 * @apiError (Errors) 443869 Invalid allowSprayBless parameter
 * @apiError (Errors) 443870 Invalid cohost id
 * @apiError (Errors) 443872 Too many cohosts
 * @apiError (Errors) 443871 Cohost not found
 * @apiError (Errors) 443877 Missing streamid for new camera
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:id", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { id } = request.params;

    if (!Utils.isValidObjectId(id)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidLiveStreamId,
        message: `UpdateLiveStreamController, invalid liveStreamId: ${id}`,
      });
    }

    const userId = user._id.toString();

    const {
      streamId,
      startTimeStamp,
      endTimeStamp,
      visibility,
      communityIds,
      tribeIds,
      linkedProductIds,
      activeProductId,
      tags: tagsFromInput,
      cohosts: cohostIds,
      allowComments,
      allowSuperBless,
      allowSprayBless,
      deleteComments = false,
      camerasToAdd = [],
      camerasToRemove = [],
      appropriateForKids = false,
      language,
    } = request.body;

    let updatePushRequired = false,
      cohostPushRequired = false,
      newCommunityIds = [],
      newTribeIds = [],
      cohostIdsToNotify = [],
      oldCohostIds = [];

    const liveStream = await LiveStream.findById(id).lean();

    if (!liveStream) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeLiveStreamNotFound,
        message: "UpdateLiveStreamController - live stream not found",
      });
    }

    if (liveStream.userId !== userId) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message: "UpdateLiveStreamController - user not stream owner",
      });
    }

    const {
      _id,
      name,
      type,
      cohosts: cohostIdsFromModel = [],
      linkedProductIds: oldLinkedProductIds = [],
    } = liveStream;
    const existingCommunityIds = liveStream.communityIds ?? [];
    const existingTribeIds = liveStream.tribeIds ?? [];

    const newCohostIds = !cohostIds
      ? []
      : cohostIds.filter((id) => !cohostIdsFromModel.includes(id));
    const allCohostIds = Array.from(new Set([...(cohostIds ?? []), cohostIdsFromModel]));

    let set = { modified: Date.now() };

    if (language && isLanguageValid(language) && language !== liveStream.language) {
      set.language = language;
    }

    if (
      typeof appropriateForKids === "boolean" &&
      appropriateForKids !== liveStream.appropriateForKids
    ) {
      set.appropriateForKids = appropriateForKids;
    }

    if (startTimeStamp && !liveStream.startTimeStamp && (liveStream.cohosts?.length ?? 0) > 0) {
      oldCohostIds = [];
      cohostIdsToNotify = liveStream.cohosts || [];
      cohostPushRequired = cohostIdsToNotify.length > 0;
    } else if (cohostIds !== undefined) {
      oldCohostIds = liveStream.cohosts || [];
      cohostIdsToNotify = cohostIds.filter((cohostId) => !oldCohostIds.includes(cohostId));
      cohostPushRequired = cohostIdsToNotify.length > 0;
    }

    if (streamId && streamId !== liveStream.streamId) {
      set.streamId = streamId;
      liveStream.streamId = streamId;
    }

    if (startTimeStamp && !liveStream.startTimeStamp) {
      if (typeof startTimeStamp !== "number") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTimeStamp,
          message: "UpdateLiveStreamController - invalid startTimeStamp",
        });
      }

      set.startTimeStamp = startTimeStamp;
      set.isActive = true;
      liveStream.startTimeStamp = startTimeStamp;
      liveStream.isActive = true;
      updatePushRequired = true;

      socketApi.flom.emitAll("userStartedStreaming", {
        userId,
        liveStreamId: id,
      });
    }

    if (endTimeStamp && !liveStream.endTimeStamp) {
      if (typeof endTimeStamp !== "number") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTimeStamp,
          message: "UpdateLiveStreamController - invalid endTimeStamp",
        });
      }

      set.endTimeStamp = endTimeStamp;
      set.isActive = false;

      socketApi.flom.emitAll("userStoppedStreaming", {
        userId,
        liveStreamId: id,
      });
    }

    if (visibility && !["public", "tribes", "community"].includes(visibility)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongVisibilityParameter,
        message: "UpdateLiveStreamController - invalid visibility",
      });
    }

    if (visibility) {
      set.visibility = visibility;
    }

    if (visibility && visibility === "public") {
      set.communityIds = [];
      set.tribeIds = [];
    }

    if (
      (visibility && visibility === "community") ||
      (!visibility && liveStream.visibility === "community" && communityIds)
    ) {
      if (!communityIds || typeof communityIds !== "string") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidCommunityIdsParam,
          message: "UpdateLiveStreamController - invalid communityIds parameter",
        });
      }

      let communityIdsArray = communityIds.split(",");

      for (const id of communityIdsArray) {
        if (!Utils.isValidObjectId(id)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidMembershipId,
            message: `UpdateLiveStreamController - invalid membershipId: ${id}`,
          });
        }

        const membership = await Membership.findById(id);

        if (!membership) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeMembershipNotFound,
            message: `UpdateLiveStreamController - membership ${id} not found`,
          });
        }
      }

      set.communityIds = communityIdsArray;
      updatePushRequired = true;
      newCommunityIds = communityIdsArray.filter((id) => !existingCommunityIds.includes(id));
    }

    if (
      (visibility && visibility === "tribes") ||
      (!visibility && liveStream.visibility === "tribes" && tribeIds)
    ) {
      if (!tribeIds || (tribeIds && typeof tribeIds !== "string")) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTribeIdsParam,
          message: "UpdateLiveStreamController - invalid tribeIds parameter",
        });
      }

      let tribeIdsArray = tribeIds.split(",");

      for (const id of tribeIdsArray) {
        if (!Utils.isValidObjectId(id)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTribeId,
            message: `UpdateLiveStreamController - invalid tribeId: ${id}`,
          });
        }

        const tribe = await Tribe.findById(id);

        if (!tribe) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeTribeNotFound,
            message: `UpdateLiveStreamController - tribe ${id} not found`,
          });
        }
      }

      set.tribeIds = tribeIdsArray;
      updatePushRequired = true;
      newTribeIds = tribeIdsArray.filter((id) => !existingTribeIds.includes(id));
    }

    if (tagsFromInput) {
      if (typeof tagsFromInput !== "string") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTagsParam,
          message: "UpdateLiveStreamController - invalid tags",
        });
      }

      const { tags, tagIds } = await handleTags({
        newTags: tagsFromInput,
        oldTags: liveStream.tags,
      });
      set.tags = tags;
      set.tagIds = tagIds;
    }

    if (allowComments !== undefined) {
      if (typeof allowComments !== "boolean") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAllowCommentsParam,
          message: "UpdateLiveStreamController - invalid allowComments param",
        });
      }

      set.allowComments = allowComments;
    }
    if (allowSuperBless !== undefined) {
      if (typeof allowSuperBless !== "boolean") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAllowSuperBlessParam,
          message: "UpdateLiveStreamController - invalid allowSuperBless param",
        });
      }

      set.allowSuperBless = allowSuperBless;
    }
    if (allowSprayBless !== undefined) {
      if (typeof allowSprayBless !== "boolean") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidAllowSprayBlessParam,
          message: "UpdateLiveStreamController - invalid allowSprayBless param",
        });
      }

      set.allowSprayBless = allowSprayBless;
    }

    if (deleteComments === true) {
      set.comments = [];
    }

    if (cohostIds !== undefined) {
      if (liveStream.type !== "event") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: "UpdateLiveStreamController - only type 'event' can have cohosts",
        });
      }

      if (cohostIds.length > Const.maxLiveStreamCohosts) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeTooManyCohosts,
          message: "UpdateLiveStreamController - too many cohosts",
        });
      }

      for (const cohostId of newCohostIds) {
        if (!Utils.isValidObjectId(cohostId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidCohostId,
            message: `UpdateLiveStreamController - invalid cohost id: ${cohostId}`,
          });
        }

        const cohost = await User.findById(cohostId, { isDeleted: 1 }).lean();

        if (!cohost || cohost?.isDeleted?.value === true) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCohostNotFound,
            message: `UpdateLiveStreamController - cohost ${cohostId} not found`,
          });
        }
      }

      set.cohosts = cohostIds;

      const { activeCohosts = [] } = liveStream;
      const filteredActiveCohosts = activeCohosts.filter((cohost) =>
        cohostIds.includes(cohost.userId),
      );
      if (filteredActiveCohosts.length < activeCohosts.length) {
        set.activeCohosts = filteredActiveCohosts;
      }
    }

    if (type === "market" && linkedProductIds) {
      let linkedProductTags = [],
        linkedProductTagIds = [];

      if (!Array.isArray(linkedProductIds) || linkedProductIds.length === 0) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoProductId,
          message: "UpdateLiveStreamController - linkedProductIds array missing or empty",
        });
      }

      for (const id of linkedProductIds) {
        if (!Utils.isValidObjectId(id)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidProductId,
            message: "UpdateLiveStreamController, invalid linked product id: " + id,
          });
        }

        const linkedProduct = await Product.findById(id).lean();

        if (!linkedProduct) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeLinkedProductNotFound,
            message: "UpdateLiveStreamController, linked product not found: " + id,
          });
        }

        if (linkedProduct.tags) {
          linkedProductTags.push(linkedProduct.tags.trim());
          linkedProductTagIds = linkedProductTagIds.concat(linkedProduct.tagIds ?? []);
        }
      }

      set.linkedProductIds = linkedProductIds;
      set.linkedProductTags = linkedProductTags.join(" ");
      set.linkedProductTagIds = Array.from(new Set(linkedProductTagIds));
    }

    if (type === "market" && activeProductId) {
      const productIds = linkedProductIds || oldLinkedProductIds || [];

      if (!productIds.includes(activeProductId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProductId,
          message:
            "UpdateLiveStreamController - invalid active product id, not in linked: " +
            activeProductId,
        });
      }

      set.activeProductId = activeProductId;
    }

    let addToSet = null,
      pull = null;

    if (camerasToAdd.length > 0) {
      for (const camera of camerasToAdd) {
        if (!camera.streamId) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeStreamIdMissing,
            message: "UpdateLiveStreamController - missing stream id for camera",
          });
        }
      }

      addToSet = { additionalCameras: { $each: camerasToAdd } };
    } else if (camerasToRemove.length > 0) {
      pull = { additionalCameras: { streamId: { $in: camerasToRemove } } };
    }

    const updateObj = {
      $set: set,
      ...(!addToSet ? {} : { $addToSet: addToSet }),
      ...(!pull ? {} : { $pull: pull }),
    };

    const updatedLiveStream = await LiveStream.findByIdAndUpdate(id, updateObj, {
      new: true,
      lean: true,
    });

    await formatLiveStreamResponse({ liveStream: updatedLiveStream });

    const responseData = { updatedLiveStream };
    Base.successResponse(response, Const.responsecodeSucceed, responseData);

    try {
      await recombee.upsertLiveStream({ liveStream: updatedLiveStream });
    } catch (error) {
      logger.error(
        "UpdateLiveStreamController, recombee error: " + error?.message || JSON.stringify(error),
      );
    }

    try {
      const dataToSend = {
        messageType: "streamUpdated",
        liveStreamId: id,
        streamData: updatedLiveStream,
      };
      await Utils.sendMessageToLiveStream({ liveStream, data: dataToSend });

      // tribe & membership
      const { receivers = [], newCohostReceivers = [] } = await getUsersForChatMessage({
        execute: updatePushRequired || cohostPushRequired,
        liveStream: updatedLiveStream,
        userId,
        newCommunityIds,
        newTribeIds,
        allCohostIds,
        cohostIdsToNotify,
      });

      // subscribers
      const { pushTokens = [], newCohostPushTokens = [] } = await getPushTokensForNotification({
        execute: updatePushRequired || cohostPushRequired,
        liveStream: updatedLiveStream,
        userId,
        newCommunityIds,
        newTribeIds,
        allCohostIds,
        cohostIdsToNotify,
      });

      if (updatePushRequired) {
        const notificationInfos = [];
        const receiversFromPushTokens =
          pushTokens.length === 0 ? [] : await User.find({ pushToken: { $in: pushTokens } }).lean();
        const allReceivers = [...receivers, ...receiversFromPushTokens];

        for (const receiver of allReceivers) {
          notificationInfos.push({
            title: `New live stream`,
            text: `${user.userName} is live: ${liveStream.name}`,
            receiverIds: [receiver?._id.toString()],
            senderId: user._id.toString(),
            referenceId: id,
            notificationType: Const.notificationTypeNewLiveStream,
          });
        }

        if (notificationInfos.length > 0) {
          await Notification.create(notificationInfos);
        }

        for (const receiver of receivers) {
          let roomId = "";

          if (user.created < receiver.created) {
            roomId = `1-${user._id.toString()}-${receiver?._id.toString()}`;
          } else {
            roomId = `1-${receiver?._id.toString()}-${user._id.toString()}`;
          }

          const messageToSend = {
            roomID: roomId,
            message: `${user.userName} is live: ${liveStream.name}`,
            type: Const.messageTypeNewLiveStream,
            attributes: { liveStream: updatedLiveStream },
          };

          await Utils.sendMessageToChat({
            messageData: messageToSend,
            senderToken: user.token[0].token,
          });
        }

        if (pushTokens.length > 0) {
          await Utils.sendPushNotifications({
            pushTokens,
            pushType: Const.pushTypeNewLiveStream,
            info: {
              title: `${user.userName} is live: ${liveStream.name}`,
              liveStream: updatedLiveStream,
            },
          });
        }
      }

      if (cohostPushRequired) {
        const notificationInfos = [];

        for (const receiver of newCohostReceivers) {
          notificationInfos.push({
            title: `Live stream co-host invitation`,
            text: `${user.userName} is inviting ${receiver?.userName || "you"} to co-host: ${
              liveStream.name
            }`,
            receiverIds: [receiver?._id.toString()],
            senderId: user._id.toString(),
            referenceId: id,
            notificationType: Const.notificationTypeLiveStreamCohostInvitation,
          });

          let roomId = "";

          if (user.created < receiver.created) {
            roomId = `1-${user._id.toString()}-${receiver?._id.toString()}`;
          } else {
            roomId = `1-${receiver?._id.toString()}-${user._id.toString()}`;
          }

          const messageToSend = {
            roomID: roomId,
            message: `${user.userName} is inviting ${receiver?.userName || "you"} to co-host: ${
              liveStream.name
            }`,
            type: Const.messageTypeLiveStreamCohostInvitation,
            attributes: { liveStream: updatedLiveStream },
          };

          await Utils.sendMessageToChat({
            messageData: messageToSend,
            senderToken: user.token[0].token,
          });
        }

        if (notificationInfos.length > 0) {
          await Notification.create(notificationInfos);
        }

        if (newCohostPushTokens.length > 0) {
          await Utils.sendPushNotifications({
            pushTokens: newCohostPushTokens,
            pushType: Const.pushTypeLiveStreamCohostInvitation,
            info: {
              title: `${user.userName} is inviting you to co-host: ${liveStream.name}`,
              liveStream: updatedLiveStream,
            },
          });
        }
      }
    } catch (error) {
      logger.error("UpdateLiveStreamController, messages", error);
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UpdateLiveStreamController",
      error,
    });
  }
});

async function getUsersForChatMessage({
  execute = false,
  liveStream,
  userId,
  newCommunityIds = null,
  newTribeIds = null,
  allCohostIds = [],
  cohostIdsToNotify = [],
}) {
  if (!execute) {
    return { receivers: [], newCohostReceivers: [] };
  }

  const { visibility, tribeIds: oldTribeIds, communityIds: oldCommunityIds } = liveStream;
  const tribeIds = newTribeIds && newTribeIds.length > 0 ? newTribeIds : oldTribeIds;
  const communityIds =
    newCommunityIds && newCommunityIds.length > 0 ? newCommunityIds : oldCommunityIds;

  let receivers = [],
    newCohostReceivers = [];

  /*
  if (visibility === "public") {
    receivers = await User.find({ followedBusinesses: userId }).lean();
  }
  */

  if (visibility === "tribes") {
    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();
    let memberIds = [];

    for (const tribe of tribes) {
      const {
        members: { accepted },
      } = tribe;

      for (const member of accepted) {
        if (member.id && !allCohostIds.includes(member.id)) {
          memberIds.push(member.id);
        }
      }
    }

    receivers = await User.find({ _id: { $in: memberIds }, "isDeleted.value": false }).lean();
  }

  if (visibility === "community") {
    receivers = await User.find({
      "memberships.id": { $in: communityIds },
      "isDeleted.value": false,
    }).lean();
  }

  if (cohostIdsToNotify.length > 0) {
    newCohostReceivers = await User.find({
      _id: { $in: cohostIdsToNotify },
      "isDeleted.value": false,
    }).lean();
  }

  return {
    receivers: receivers.filter((receiver) => !cohostIdsToNotify.includes(receiver._id.toString())),
    newCohostReceivers,
  };
}

async function getPushTokensForNotification({
  execute = false,
  liveStream,
  userId,
  newCommunityIds = null,
  newTribeIds = null,
  allCohostIds = [],
  cohostIdsToNotify = [],
}) {
  if (!execute) {
    return { pushTokens: [], newCohostPushTokens: [] };
  }

  const { visibility, tribeIds: oldTribeIds, communityIds: oldCommunityIds } = liveStream;
  // const tribeIds = newTribeIds && newTribeIds.length > 0 ? newTribeIds : oldTribeIds;
  // const communityIds =
  //   newCommunityIds && newCommunityIds.length > 0 ? newCommunityIds : oldCommunityIds;

  let pushTokens = [],
    newCohostPushTokens = [];

  if (visibility === "public") {
    const followers = await User.find({
      followedBusinesses: userId,
      "isDeleted.value": false,
    }).lean();

    for (const follower of followers) {
      const id = follower._id.toString();
      if (follower.pushToken && !allCohostIds.includes(id)) {
        pushTokens = [...pushTokens, ...follower.pushToken];
      }
    }
  }

  if (cohostIdsToNotify.length > 0) {
    const newCohosts = await User.find({
      _id: { $in: cohostIdsToNotify },
      "isDeleted.value": false,
    }).lean();
    for (const cohost of newCohosts) {
      if (cohost.pushToken) {
        newCohostPushTokens = [...newCohostPushTokens, ...cohost.pushToken];
      }
    }
  }

  return { pushTokens, newCohostPushTokens };

  /*
  if (visibility === "tribes") {
    const tribes = await Tribe.find({ _id: { $in: tribeIds } }).lean();
    let memberIds = [];

    for (const tribe of tribes) {
      const {
        members: { accepted },
      } = tribe;

      for (const member of accepted) {
        if (member.id && !allCohostIds.includes(member.id)) {
          memberIds.push(member.id);
        }
      }
    }

    const members = await User.find({ _id: { $in: memberIds } , "isDeleted.value": false}).lean();
    for (const member of members) {
      pushTokens = [...pushTokens, ...member.pushToken];
    }
  }

  if (visibility === "community") {
    const members = await User.find({ "memberships.id": { $in: communityIds }, "isDeleted.value": false }).lean();

    for (const member of members) {
      const id = follower._id.toString();
      if (member.pushToken && !allCohostIds.includes(id)) {
        pushTokens = [...pushTokens, ...member.pushToken];
      }
    }
  }

  if (cohostIdsToNotify.length > 0) {
    const newCohosts = await User.find({ _id: { $in: cohostIdsToNotify } , "isDeleted.value": false}).lean();
    for (const cohost of newCohosts) {
      if (cohost.pushToken) {
        newCohostPushTokens = [...newCohostPushTokens, ...cohost.pushToken];
      }
    }
  }

  return { pushTokens, newCohostPushTokens };
  */
}

module.exports = router;
