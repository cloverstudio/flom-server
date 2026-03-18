"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Category, Product, User, ApiAccessLog, Sound } = require("#models");
const { recombee } = require("#services");
const { handleTags } = require("#logics");
const {
  checkTribeVisibility,
  checkCommunityVisibility,
  isLanguageValid,
  handleVideoFile,
  handleImageFile,
  handleAudioFile,
} = require("../helpers");

/**
 * @api {post} /api/v2/products/new Add new product v2 flom_v1
 * @apiVersion 2.0.23
 * @apiName Add new product v2 flom_v1
 * @apiGroup WebAPI Products
 * @apiDescription New API for creating products (videos, video stories, podcasts and text stories). NOTE! for creating product use Add Product v2 or Add Product with big file v2. NOTE2! This new API uses new media processing logic.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}   name Product name
 * @apiParam {String}   [linkedProductId] Linked product id.
 * @apiParam {String}   description Product description. Only NOT required for video stories and podcast.
 * @apiParam {String}   type Type of the product: 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product
 * @apiParam {String}   [appropriateForKids] Is video appropriate for kids 0 - false, 1 - true
 * @apiParam {String}   [privateVideo] Is video private 0 - false, 1 - true
 * @apiParam {String}   [visibility] Visibility of the product: "public", "tribes" or "community". Defaults to "public". Tribe products are shared with tribes only, tribeIds are required in this case. Community products are shared with community only, visible but locked for those who are not part of the community.
 * @apiParam {String}   [tribeIds] Comma separated string of tribe ids  with who to share the product with. Required if visibility is set to "tribes".
 * @apiParam {String}   [communityIds] Comma separated string of community ids  with who to share the product with. Required if visibility is set to "community"
 * @apiParam {String}   [categoryId] Category id of the product. Defaults to default product category ("5bd98d220bb237660b061159")
 * @apiParam {String}   [isDraft] Is product a draft 0 - false, 1 - true. Defaults to false
 * @apiParam {Number}   [allowPublicComments] Are public comments allowed (0 for false, 1 for true, default is false)
 * @apiParam {File}     [video] Product video (required for type 1 and 2)
 * @apiParam {File}     [image] Product image (required for type 3 and 4)
 * @apiParam {File}     [audio] Product audio (required for type 3)
 * @apiParam {String}   [tags] Product tags
 * @apiParam {Number}   [availableForExpo] Is audio product available for expo (1 for true, any other number/string for false)
 * @apiParam {String}   [audioForExpoId] Id of audio product used for expo (DEPRECATED)
 * @apiParam {String[]} [audioFileNames] Comma separated string of file names (nameOnServer) of audio products to be used for expo. If using this, do not send audioForExpoId.
 * @apiParam {Number}   [priceSingle] Single-use price in sats of audio product available for expo (whole numbers only)
 * @apiParam {Number}   [priceUnlimited] Unlimited-use price in sats of audio product available for expo (whole numbers only)
 * @apiParam {Number}   [priceExclusive] Exclusive-use price in sats of audio product available for expo (whole numbers only)
 * @apiParam {String}   location location - string "longitude,latitude"
 * @apiParam {String}   updateUserLocation updateUserLocation - 1 or 0
 * @apiParam {String}   [language] language of the product (default is user's device language)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1643874654870,
 *   "data": {
 *     "product": {
 *       "price": -1,
 *       "created": 1643874654818,
 *       "file": [
 *         {
 *           "file": {
 *             "originalName": "MOV_0163.mp4",
 *             "nameOnServer": "Xof5dmZmgJjvgECELBRbXzGF7mXaUGcH",
 *             "aspectRatio": 0.5625,
 *             "duration": 7.2072,
 *             "width": 352,
 *             "height": 640,
 *             "mimeType": "video/mp4",
 *             "size": 15931106,
 *             "hslName": "XTPRjEbsu9STsxxEOoBsU8K09dAvmug2"
 *           },
 *           "thumb": {
 *             "originalName": "MOV_0163.mp4",
 *             "nameOnServer": "12834B3efEBcfCEZOu8DZtSGr2coonbh",
 *             "mimeType": "image/jpeg",
 *             "size": 104732
 *           },
 *           "_id": "61fb895e715eb45a5c247a8e",
 *           "fileType": 1,
 *           "order": 0
 *         }
 *       ],
 *       "image": [],
 *       "location": {
 *         "coordinates": [
 *           0,
 *           0
 *         ],
 *         "type": "Point"
 *       },
 *       "minPrice": -1,
 *       "maxPrice": -1,
 *       "localPrice": {
 *         "localMin": -1,
 *         "localMax": -1,
 *         "localAmount": -1,
 *         "amount": -1,
 *         "minAmount": -1,
 *         "maxAmount": -1
 *       },
 *       "numberOfLikes": 0,
 *       "hashtags": [
 *            "6297360d0794dd546ed51798",
 *            "6297360d0794dd546ed51797",
 *            "62974ab10467a26a2c09176d"
 *       ],
 *       "moderation": {
 *         "status": 1
 *       },
 *       "visibility": "tribes",
 *       "tribeIds": [
 *         "61fa58783b607657a175c638",
 *         "61fa5d593b607657a175c63c"
 *       ],
 *       "_id": "61fb895e715eb45a5c247a8d",
 *       "name": "A tribe Video",
 *       "description": "Video for 2 tribes",
 *       "type": 1,
 *       "ownerId": "5f7ee464a283bc433d9d722f",
 *       "parentCategoryId": "5bd98d220bb237660b061159",
 *       "linkedProductId": "5f294ebf18f352279ef2a7e4",
 *       "categoryId": "5bd98d220bb237660b061159",
 *       "allowPublicComments": true,
 *       "owner": {
 *         "_id": "5f7ee464a283bc433d9d722f",
 *         "name": "mdragic",
 *         "phoneNumber": "+2348020000007",
 *         "avatar": {
 *           "picture": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 4698848,
 *             "mimeType": "image/png",
 *             "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *           },
 *           "thumbnail": {
 *             "originalName": "cropped2444207444774310745.jpg",
 *             "size": 97900,
 *             "mimeType": "image/png",
 *             "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *           }
 *         },
 *         "bankAccounts": [
 *           {
 *             "_id": "61f7e4eb9738b845fef89c95",
 *             "merchantCode": "40200168",
 *             "name": "SampleAcc",
 *             "accountNumber": "1503567574679",
 *             "code": "",
 *             "selected": true
 *           }
 *         ],
 *         "location": {
 *           "type": "Point",
 *           "coordinates": [
 *             0,
 *             0
 *           ]
 *         },
 *         "locationVisibility": false,
 *         "aboutBusiness": "text",
 *         "businessCategory": {
 *           "id": null,
 *           "name": "Electronics & accessories"
 *         },
 *         "workingHours": {
 *           "start": "14",
 *           "end": "15"
 *         },
 *         "created": 1602151524372,
 *         "isAppUser": true,
 *         "username": "mdragic"
 *       },
 *       "category": {
 *         "_id": "5ca458e731780ea12c79f6f2",
 *         "name": "Security Fencing",
 *         "parentId": "5ca44d7208f8045e4e3471e1",
 *         "group": [
 *           1
 *         ]
 *       },
 *       "parentCategory": {
 *         "_id": "5ca44d7208f8045e4e3471e1",
 *         "name": "Security Services",
 *         "parentId": "-1",
 *         "group": [
 *           1
 *         ]
 *       }
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400121 No type parameter
 * @apiError (Errors) 400122 Invalid or no file (e.g. sending image for type 2 - video story)
 * @apiError (Errors) 400123 No required file (e.g. not sending audio for type 4 - podcast)
 * @apiError (Errors) 400124 Error when handling video file
 * @apiError (Errors) 400127 Quick video video length is longer than 60 seconds
 * @apiError (Errors) 400128 Not a valid categoryId
 * @apiError (Errors) 400129 Category not found
 * @apiError (Errors) 400131 Invalid category for this product type
 * @apiError (Errors) 400140 No description parameter
 * @apiError (Errors) 443226 Invalid type parameter (has to be between 1 and 4)
 * @apiError (Errors) 443228 Invalid visibility parameter
 * @apiError (Errors) 443490 No tribe ids parameter
 * @apiError (Errors) 443473 One or more tribe ids is invalid
 * @apiError (Errors) 443474 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443487 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443240 One or more community ids is invalid
 * @apiError (Errors) 443241 One or more communities (from communityIds) is not found
 * @apiError (Errors) 4000120 No name parameter
 * @apiError (Errors) 400162 Link not valid
 * @apiError (Errors) 400163 Linked product not found
 * @apiError (Errors) 443841 Audio for expo not found
 * @apiError (Errors) 443842 Audio for expo not available to user
 * @apiError (Errors) 443919 Adding audio for expo failed
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000060 Users products blocked and user is blocked from creating new products
 */

router.post(
  "/new",
  auth({ allowUser: true, allowAdmin: true }),
  async function (request, response) {
    try {
      const { fields, files = {} } = await Utils.formParse(request);
      console.log("fields", fields, "files", files);
      const {
        name,
        description,
        visibility = Const.defaultProductVisibility,
        categoryId = "5bd98d220bb237660b061159",
        linkedProductId,
        audioForExpoId = null,
        location: locationStr,
      } = fields;
      const type = +fields.type;
      const availableForExpo = fields.availableForExpo === "1" && type === Const.productTypePodcast;
      const updateUserLocation =
        fields.updateUserLocation == 1 || fields.updateUserLocation == "true" ? true : false;
      const language = isLanguageValid(fields.language || request.user.deviceLanguage)
        ? fields.language || request.user.deviceLanguage
        : "en";

      const audioFileNames = !fields.audioFileNames
        ? []
        : fields.audioFileNames.split(",").map((name) => name.trim());

      let { tribeIds, communityIds } = fields;

      let appropriateForKids,
        privateVideo,
        isDraft = false,
        allowPublicComments = false;
      if (fields.appropriateForKids) {
        appropriateForKids = !!+fields.appropriateForKids;
      }
      if (fields.privateVideo) {
        privateVideo = !!+fields.privateVideo;
      }
      if (fields.isDraft) {
        isDraft = !!+fields.isDraft;
      }
      if (fields.allowPublicComments !== undefined) {
        allowPublicComments = !!+fields.allowPublicComments;
      }

      const owner = request.user;
      const ownerId = owner._id.toString();

      if (owner.blockedProducts) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserBlocked,
          message: `AddNewProductControllerV2, user blocked`,
        });
      }

      if (!name && !isDraft) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNoProductName,
          message: `AddNewProductControllerV2, no product name`,
        });
      }
      if (!type) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNoType,
          message: `AddNewProductControllerV2, no product type`,
        });
      }
      if (Const.productTypes.indexOf(type) === -1 || type === Const.productTypeProduct) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: `AddNewProductControllerV2, wrong type parameter`,
        });
      }
      if (
        !description &&
        [Const.productTypeVideoStory, Const.productTypePodcast].indexOf(type) === -1 &&
        !isDraft
      ) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNoProductDescription,
          message: `AddNewProductControllerV2, no description`,
        });
      }

      let originalPrice = undefined,
        isFree = undefined;
      if (type === Const.productTypePodcast && availableForExpo) {
        originalPrice = {
          countryCode: "SAT",
          currency: "SAT",
        };

        if (!fields.priceSingle && !fields.priceUnlimited && !fields.priceExclusive) {
          isFree = true;
        } else if (
          (fields.priceSingle && !isNan(+fields.priceSingle) && +fields.priceSingle > 0) ||
          (fields.priceUnlimited && !isNan(+fields.priceUnlimited) && +fields.priceUnlimited > 0) ||
          (fields.priceExclusive && !isNan(+fields.priceExclusive) && +fields.priceExclusive > 0)
        ) {
          if (fields.priceSingle) {
            originalPrice.singleValue = Math.floor(+fields.priceSingle);
          }
          if (fields.priceUnlimited) {
            originalPrice.unlimitedValue = Math.floor(+fields.priceUnlimited);
          }
          if (fields.priceExclusive) {
            originalPrice.exclusiveValue = Math.floor(+fields.priceExclusive);
          }
        }
      }

      if (Const.productVisibilities.indexOf(visibility) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeWrongVisibilityParameter,
          message: `AddNewProductControllerV2, wrong visibility parameter`,
        });
      } else if (visibility === Const.productVisibilityTribes) {
        if (!tribeIds || tribeIds === "") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeNoTribeIds,
            message: `AddNewProductControllerV2, no tribeIds parameter`,
          });
        }
        const tribeIdsArray = tribeIds.split(",");

        const { code, message } =
          (await checkTribeVisibility({
            tribeIds: tribeIdsArray,
            requestUserId: ownerId,
          })) || {};
        if (code) {
          return Base.newErrorResponse({
            response,
            code,
            message: `AddNewProductControllerV2, ${message}`,
          });
        }

        tribeIds = tribeIdsArray;
      } else if (visibility === Const.productVisibilityCommunity) {
        if (!communityIds || communityIds === "") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeMembershipNotFound,
            message: `AddNewProductControllerV2, no communityIds parameter`,
          });
        }

        const communityIdsArray = communityIds.split(",");

        const { code, message } =
          (await checkCommunityVisibility({
            communityIds: communityIdsArray,
          })) || {};
        if (code) {
          return Base.newErrorResponse({
            response,
            code,
            message: `AddNewProductControllerV2, ${message}`,
          });
        }

        communityIds = communityIdsArray;
      }

      let category,
        parentCategoryId = -1,
        parentCategory;
      if (categoryId) {
        if (!Utils.isValidObjectId(categoryId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductInvalidCategoryId,
            message: `AddNewProductControllerV2, categoryId is not a valid id`,
          });
        }

        category = await Category.findOne({ _id: categoryId }).lean();
        if (!category) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductCategoryNotFound,
            message: `AddNewProductControllerV2, category not found`,
          });
        }

        if (
          !Utils.checkProductCategoryGroup({ productType: type, categoryGroups: category.group })
        ) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductInvalidCategory,
            message: `AddNewProductControllerV2, invalid category`,
          });
        }

        parentCategoryId = category.parentId;
        if (parentCategoryId !== "-1") {
          parentCategory = await Category.findOne({ _id: parentCategoryId }).lean();
        }
      }

      const { audioForExpo, audiosForExpo, err } = await handleAudiosForExpo({
        audioForExpoId,
        audioFileNames,
        userId: request.user._id.toString(),
        productType: type,
      });

      if (err) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAddingAudioForExpoFailed,
          message: `AddNewProductControllerV2, adding audio for expo failed`,
        });
      }

      const tagsInput = fields.tags;
      let tags, hashtags;

      if (tagsInput !== undefined) {
        const { tags: tagsString, tagIds: tagsArray } = await handleTags({ newTags: tagsInput });

        tags = tagsString;
        hashtags = tagsArray;
      }

      if (linkedProductId) {
        const linkedProduct = await Product.findOne({ _id: linkedProductId }).lean();
        if (!linkedProduct) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeLinkedProductNotFound,
            message: `AddNewProductControllerV2, linked product not found`,
          });
        }
      }

      let location, address;

      if (locationStr) {
        const locationArr = locationStr.split(",");

        location = {
          type: "Point",
          coordinates: [+locationArr[0], +locationArr[1]],
        };
      } else {
        location = owner.location;
      }

      if (location) {
        const { coordinates = [0, 0] } = location;

        if (coordinates[0] !== 0 || coordinates[1] !== 0) {
          await ApiAccessLog.create({
            type: "LocationIQ",
            api: "AddNewProductControllerV2",
            userName: request.user.userName,
            createdDate: new Date(),
          });

          address = await Utils.getAddressFromCoordinates({
            lat: coordinates[1],
            lon: coordinates[0],
          });
        }
      }

      if (updateUserLocation && location) {
        await User.findByIdAndUpdate(ownerId, { location });
      }

      const moderationStatus = isDraft
        ? Const.moderationStatusDraft
        : owner.merchantApplicationStatus === Const.merchantApplicationStatusApprovedWithPayout
        ? Const.moderationStatusApproved
        : Const.moderationStatusPending;

      const product = await Product.create({
        name,
        description,
        countryCode: owner.countryCode,
        language,
        type,
        tags,
        hashtags,
        location,
        address,
        moderation: { status: moderationStatus },
        ownerId,
        parentCategoryId,
        categoryId,
        allowPublicComments,
        appropriateForKids,
        privateVideo,
        visibility,
        tribeIds,
        communityIds,
        linkedProductId,
        availableForExpo,
        isFree,
        audioForExpoInfo: audioForExpo,
        audiosForExpo,
        originalPrice,
        mediaProcessingInfo: { status: "processing" },
      });

      try {
        await recombee.upsertProduct({ product: product.toObject() });
      } catch (error) {
        logger.error(`AddNewProductControllerV2, ${product._id.toString()}, recombee`, error);
      }

      processMedia({ productId: product._id.toString(), files, type, isDraft });

      await handleAudioForExpoPostProcessing({ product: product.toObject() });

      let productObj = product.toObject();
      delete productObj.__v;

      productObj.owner = {
        _id: ownerId,
        name: owner.name,
        phoneNumber: owner.phoneNumber,
        avatar: owner.avatar,
        bankAccounts: owner.bankAccounts,
        location: owner.location,
        locationVisibility: owner.locationVisibility,
        aboutBusiness: owner.aboutBusiness,
        businessCategory: owner.businessCategory,
        workingHours: owner.workingHours,
        created: owner.created,
        isAppUser: owner.isAppUser,
        username: owner.userName,
      };

      productObj.category = category;
      if (parentCategory) {
        productObj.parentCategory = parentCategory;
      }

      Base.successResponse(response, Const.responsecodeSucceed, { product: productObj });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AddNewProductControllerV2",
        error,
      });
    }
  },
);

async function handleAudiosForExpo({
  audioForExpoId = null,
  audioFileNames = [],
  userId,
  productType,
}) {
  try {
    if (!audioForExpoId && audioFileNames.length === 0) {
      logger.info(
        "AddNewProductControllerV2, handleAudiosForExpo, no audioForExpoId or audioFileNames",
      );
      return { audioForExpo: undefined, audiosForExpo: undefined };
    }

    if (productType !== Const.productTypeVideoStory) {
      logger.error(
        `AddNewProductControllerV2, handleAudiosForExpo, can't add audio to non expo product`,
      );
      return { audioForExpo: undefined, audiosForExpo: undefined };
    }

    const audios = [];

    if (audioForExpoId) {
      let audioProduct,
        audioProductType = "product";
      audioProduct = await Product.findById(audioForExpoId).lean();
      if (!audioProduct || audioProduct.type !== Const.productTypePodcast) {
        audioProduct = await Sound.findById(audioForExpoId).lean();
        audioProductType = "sound";

        if (!audioProduct) {
          logger.error(
            `AddNewProductControllerV2, handleAudiosForExpo, audioForExpoId ${audioForExpoId} not found`,
          );
          return { err: 1 };
        }
      }

      audios.push({ audio: audioProduct, type: audioProductType });
    } else if (audioFileNames && audioFileNames.length > 0) {
      const products = await Product.find({
        "file.file.nameOnServer": { $in: audioFileNames },
      }).lean();
      const sounds = await Sound.find({ "audio.nameOnServer": { $in: audioFileNames } }).lean();

      products.forEach((product) => {
        audios.push({ audio: product, type: "product" });
      });
      sounds.forEach((sound) => {
        audios.push({ audio: sound, type: "sound" });
      });
    }

    if (audios.length === 0) {
      logger.error(`AddNewProductControllerV2, handleAudiosForExpo, no audios found?`);
      return { err: 1 };
    }

    const resultArray = [];

    for (const item of audios) {
      const { audio: audioProduct, type: audioProductType } = item;

      if (audioProductType === "product") {
        const purchaseHistory = audioProduct.contentPurchaseHistory || [];
        let isAvailable = !!audioProduct.isFree;

        if (audioProduct.ownerId === userId) {
          isAvailable = true;
        }
        purchaseHistory.forEach((purchase) => {
          if (purchase.buyerId === userId) {
            isAvailable = true;
          }
        });

        if (!isAvailable) {
          logger.error(
            `AddNewProductControllerV2, handleAudiosForExpo, audio product not available to user`,
          );
          return { err: 1 };
        }
      }

      const { name, title, created, ownerId: audioOwnerId, file = [], audio = {} } = audioProduct;

      let audioOwner;
      if (audioOwnerId) {
        audioOwner = await User.findById(audioOwnerId).lean();
      }

      const audioForExpoInfo = {
        audioId: audioProduct._id.toString(),
        name: name || title,
        created,
        audioType: "sound",
        nameOnServer: audio.nameOnServer,
      };
      if (audioOwner) {
        audioForExpoInfo.ownerId = audioOwnerId;
        audioForExpoInfo.ownerUserName = audioOwner.userName;
        audioForExpoInfo.ownerPhoneNumber = audioOwner.phoneNumber;
        audioForExpoInfo.audioType = "product";
        audioForExpoInfo.nameOnServer = file[0]?.file?.nameOnServer;
      }

      resultArray.push(audioForExpoInfo);
    }

    return { audioForExpo: resultArray[0], audiosForExpo: resultArray };
  } catch (error) {
    logger.error("AddNewProductControllerV2, handleAudiosForExpo", error);
    return { err: 1 };
  }
}

async function handleAudioForExpoPostProcessing({ product = null }) {
  if (!product) {
    logger.error("AddNewProductControllerV2, handleAudiosForExpo, no product");
    return;
  }

  const { ownerId, audiosForExpo = [] } = product;

  for (const audioForExpoInfo of audiosForExpo) {
    const query = { $inc: { usedInExpoCount: 1 } };
    const model = audioForExpoInfo.audioType === "product" ? Product : Sound;
    const audioProduct = await model.findById(audioForExpoInfo.audioId).lean();

    if (audioForExpoInfo.audioType === "product") {
      const purchaseHistory = audioProduct.contentPurchaseHistory || [];
      let isSingleUse = false;

      purchaseHistory.forEach((purchase) => {
        if (
          purchase.buyerId === ownerId &&
          purchase.purchaseType === Const.contentPurchaseTypeSingle
        ) {
          isSingleUse = true;
        }
      });

      if (isSingleUse) {
        query.$pull = { contentPurchaseHistory: { buyerId: ownerId } };
      }
    }

    await model.findByIdAndUpdate(audioForExpoInfo.audioId, query);
  }

  return;
}

async function processMedia({ productId, files, type, isDraft }) {
  const allFiles = [];
  let hasVideo = false,
    hasImage = false,
    hasAudio = false;

  try {
    let order = 0;

    const fileKeys = Object.keys(files);
    for (let i = 0; i < fileKeys.length; i++) {
      const file = files[fileKeys[i]];
      const fileMimeType = file.type;
      let fileData = {};

      if (fileMimeType.indexOf("video") !== -1) {
        if ([Const.productTypeVideo, Const.productTypeVideoStory].indexOf(type) === -1) {
          await handleProcessingError({
            productId,
            error: "video file not supported for this type",
          });
          return;
        }
        try {
          if (type === Const.productTypeVideoStory) {
            const originalVideoMetadata = await Utils.getFileMetadata(file.path);
            for (let i = 0; i < originalVideoMetadata.streams.length; i++) {
              if (originalVideoMetadata.streams[i]["codec_type"] === "video") {
                if (originalVideoMetadata.streams[i].duration > 63) {
                  await handleProcessingError({
                    productId,
                    error: "quick video longer than 63 seconds",
                  });
                  return;
                }
              }
            }
          }
          fileData = await handleVideoFile(file);
          hasVideo = true;
        } catch (error) {
          await handleProcessingError({ productId, error: "error with video file" });
          return;
        }
      } else if (fileMimeType.indexOf("image") !== -1) {
        if ([Const.productTypePodcast, Const.productTypeTextStory].indexOf(type) === -1) {
          await handleProcessingError({
            productId,
            error: "image file not supported for this type",
          });
          return;
        }
        fileData = await handleImageFile(file);
        hasImage = true;
      } else if (fileMimeType.indexOf("audio") !== -1) {
        if (type !== Const.productTypePodcast) {
          await handleProcessingError({
            productId,
            error: "audio file not supported for this type",
          });
          return;
        }
        fileData = await handleAudioFile(file);
        hasAudio = true;
      } else {
        //invalid file for the product type. Skip to next file
        logger.warn(`Invalid file with mime type: ${fileMimeType}`);
        continue;
      }
      fileData.order = order++;
      allFiles.push(fileData);
    }
  } catch (error) {
    await handleProcessingError({ productId, error: error.message });
    return;
  }

  if (!isDraft) {
    //check if correct files have been added for each product type
    console.log(type, hasVideo, hasImage, hasAudio);
    if (type === Const.productTypeVideo && hasVideo && !hasImage && !hasAudio) {
    } else if (type === Const.productTypeVideoStory && hasVideo && !hasImage && !hasAudio) {
    } else if (type === Const.productTypePodcast && hasAudio && !hasVideo) {
    } else if (type === Const.productTypeTextStory && !hasAudio && !hasVideo) {
    } else {
      await handleProcessingError({ productId, error: "invalid or no file" });
      return;
    }
  }

  logger.info(`AddNewProductControllerV2, product ${productId} media processing completed`);
  await Product.findByIdAndUpdate(productId, {
    file: allFiles,
    mediaProcessingInfo: {
      status: "completed",
    },
  });

  return;
}

async function handleProcessingError({ productId, error }) {
  logger.error(`AddNewProductControllerV2, product ${productId} media processing error: ${error}`);

  await Product.findByIdAndUpdate(productId, {
    mediaProcessingInfo: { status: "failed", error },
  });

  return;
}

module.exports = router;
