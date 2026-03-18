"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Category, Product, User, Sound } = require("#models");
const { recombee } = require("#services");
const { handleTags } = require("#logics");
const {
  checkTribeVisibility,
  checkCommunityVisibility,
  checkDraftProduct,
  isLanguageValid,
  handleVideoFile,
  handleImageFile,
  handleAudioFile,
  deleteFile,
} = require("../helpers");

const util = require("util");

/**
 * @api {patch} /api/v2/products/:productId/new Update product v2 flom_v1
 * @apiVersion 2.0.23
 * @apiName Update product v2 flom_v1
 * @apiGroup WebAPI Products
 * @apiDescription API for updating new products (videos, video stories, podcasts and text stories). NOTE! for updating product (type 5) use Edit Product v2 or Edit Product with big file v2. NOTE2! This new API uses new media processing logic.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}   [name] Product name
 * @apiParam {String}   [linkedProductId] Linked product id. If linkedProductId is equal to "", the field will be deleted from item model.
 * @apiParam {String}   [description] Product description. Only NOT required for video stories and podcast.
 * @apiParam {String}   [visibility] Visibility of the product: "public" or "tribes". Defaults to "public". Tribe products are shared with tribes only, tribeIds are required in this case.
 * @apiParam {String}   [tribeIds] Comma separated string of tribe ids  with who to share the product with. Required if visibility is set to "tribes".
 * @apiParam {String}   [categoryId] Category id of the product
 * @apiParam {String}   [publish] Publish the draft 0 - false, 1 - true. Defaults to false. There will be check if product has all necessary fields
 * @apiParam {Number}   [allowPublicComments] Are public comments allowed (0 for false, 1 for true, default is false)
 * @apiParam {File}     [video] Product video (for type 1 and 2)
 * @apiParam {String}   [deleteImage] Used to delete image, send "1" to delete image. Only allowed for podcast and text stories
 * @apiParam {File}     [image] Product image (for type 3 and 4)
 * @apiParam {File}     [audio] Product audio (for type 3)
 * @apiParam {String}   [tags] Product tags
 * @apiParam {String}   [appropriateForKids] Is video appropriate for kids 0 - false, 1 - true
 * @apiParam {Number}   [availableForExpo] Is audio product available for expo (1 for true, any other number/string for false)
 * @apiParam {String}   [audioForExpoId] Id of audio product used for expo (if none sent and audio for expo exists, it is removed) (DEPRECATED)
 * @apiParam {String[]} [audioFileNames] Comma separated string of file names (nameOnServer) of audio products to be used for expo. If different than current list, will update. If audios present and empty array or no param sent, current audios will be deleted. If same as current, no change.
 * @apiParam {Number}   [priceSingle] Single-use price in sats of audio product available for expo (only whole numbers)
 * @apiParam {Number}   [priceUnlimited] Unlimited-use price in sats of audio product available for expo (only whole numbers)
 * @apiParam {Number}   [priceExclusive] Exclusive-use price in sats of audio product available for expo (only whole numbers)
 * @apiParam {String}   [language] language of the product (default is user's device language)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635324336904,
 *   "data": {
 *     "product": {
 *       "_id": "5bf7e172ae0e12313c956496",
 *       "name": "ime",
 *       "description": "ad3esc",
 *       "type": 1, // video
 *        "file": [{
 *          "file": {
 *            "originalName": "VIDEO_20180914_102709.mp4",
 *            "size": 1794529,
 *            "width": 352,
 *            "height": 640,
 *            "mimeType": "video/mp4",
 *            "nameOnServer": "8GSOlr30wtZwu3iw4h9bo4cVDHJeSsSM",
 *            "hlsName": "0wtZwu3iw4h9bo4cVDHJeSsSM",
 *            "aspectRatio" : 1.33334,
 *            "duration": 23.804
 *          },
 *          "thumb": {
 *            "originalName": "VIDEO_20180914_102709.mp4",
 *            "size": 105631,
 *            "mimeType": "image/png",
 *            "nameOnServer": "E0U3Og78HRgDGk1b1rK12UwtUuRsQr1u"
 *          },
 *          "_id": "5bf7e172ae0e12313c95649a",
 *          "order": 0,
 *          "fileType": 1
 *        }],
 *       "parentCategoryId" : "5ca44d7208f8045e4e3471e1",
 *       "linkedProductId": "5f294ebf18f352279ef2a7e4",
 *       "categoryId" : "5ca458e731780ea12c79f6f2",
 *       "allowPublicComments": true,
 *       "image": [],
 *       "ownerId": "5bd05466e42d857e2a42a307",
 *       "numberOfLikes" : 0,
 *       "moderation" : {
 *         "status" : 1
 *       },
 *      "tags": "#cars #vw #supercar",
 *      "hashtags": [
 *          "6297360d0794dd546ed51797",
 *          "6297360d0794dd546ed51798",
 *          "62974ab00467a26a2c09176c",
 *          "62974c55830d4b6c60fd19b6"
 *       ],
 *       "visibility": "tribes",
 *       "tribeIds": [
 *         "61fa58783b607657a175c638",
 *         "61fa5d593b607657a175c63c"
 *       ],
 *       "maxPrice" : -1,
 *       "minPrice" : -1,
 *       "localPrice" : {
 *         "localMin" : -1,
 *         "localMax" : -1,
 *         "localAmount" : -1,
 *         "amount" : -1,
 *         "minAmount" : -1,
 *         "maxAmount" : -1
 *       },
 *       "created": 1542971762984,
 *       "__v": 0,
 *       "owner": {
 *         "avatar": {
 *           "picture": {
 *             "originalName": "scaled_20190131_112506.jpg",
 *             "size": 586494,
 *             "mimeType": "image/png",
 *             "nameOnServer": "npUVDZil2dqDqLZD0hl1o84vaNjXytAr"
 *           },
 *           "thumbnail": {
 *             "originalName": "scaled_20190131_112506.jpg",
 *             "size": 83800,
 *             "mimeType": "image/png",
 *             "nameOnServer": "S2aFbwRcpF2gssZal8S5SEIkzAtVI3fn"
 *           }
 *         },
 *         "bankAccounts": [
 *           {
 *             "_id": "5c518e701a08a651013e63dd",
 *             "name": "GTB",
 *             "accountNumber": "017****910",
 *             "code": "000013",
 *             "merchantCode": "40210229",
 *             "selected": true
 *           }
 *         ],
 *         "location": {
 *           "coordinates": [
 *             0,
 *             0
 *           ],
 *           "type": "Point"
 *         },
 *         "locationVisibility": false,
 *         "workingHours": {
 *           "start": "12.00",
 *           "end": "14.00"
 *         },
 *         "_id": "5c518be51a08a651013e63dc",
 *         "name": "Business",
 *         "phoneNumber": "+2348101958509",
 *           "aboutBusiness": " rj rj r nr m tm tm tm",
 *           "created": 1540834941603
 *         },
 *         "category": {
 *           "_id": "5ca458e731780ea12c79f6f2",
 *           "name": "Security Fencing",
 *           "parentId": "5ca44d7208f8045e4e3471e1",
 *           "group": [
 *             1
 *           ]
 *         },
 *         "parentCategory": {
 *           "_id": "5ca44d7208f8045e4e3471e1",
 *           "name": "Security Services",
 *           "parentId": "-1",
 *           "group": [
 *             1
 *           ]
 *         }
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
 * @apiError (Errors) 400122 Invalid or no file (e.g. sending image for type 2 - video story)
 * @apiError (Errors) 400124 Error when handling video file
 * @apiError (Errors) 400128 Not a valid categoryId
 * @apiError (Errors) 400129 Category not found
 * @apiError (Errors) 400131 Invalid category for this product type
 * @apiError (Errors) 400160 Product not found
 * @apiError (Errors) 400163 Linked product not found
 * @apiError (Errors) 400500 User is not the product owner
 * @apiError (Errors) 443225 Invalid productId parameter
 * @apiError (Errors) 443227 API can not update product with type 5
 * @apiError (Errors) 443228 Invalid visibility parameter
 * @apiError (Errors) 443490 No tribe ids parameter
 * @apiError (Errors) 443473 One or more tribe ids is invalid
 * @apiError (Errors) 443474 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443487 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443841 Audio for expo not found
 * @apiError (Errors) 443842 Audio for expo not available to user
 * @apiError (Errors) 443844 Cannot update exclusive product
 * @apiError (Errors) 443919 Adding audio for expo failed
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch(
  "/:productId/new",
  auth({ allowUser: true, allowAdmin: true, role: Const.Role.REVIEWER }),
  async function (request, response) {
    try {
      const { productId } = request.params;
      const user = request.user;
      const requestUserId = user._id.toString();
      const isAdmin = request.isAdmin;

      if (!Utils.isValidObjectId(productId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidProductId,
          message: `UpdateProductControllerV2, productId is not valid`,
        });
      }

      let product = await Product.findOne({ _id: productId, isDeleted: false });
      if (!product) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductNotFound,
          message: `UpdateProductControllerV2, product not found`,
        });
      }

      if (product.ownerId !== requestUserId && !isAdmin) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeUserIsNotProductOwner,
          message: `UpdateProductControllerV2, user not the owner`,
        });
      }

      if (product.type === 5) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCanNotUpdateProduct,
          message: `UpdateProductControllerV2, can't update products with type 5`,
        });
      }

      const purchaseHistory = product.contentPurchaseHistory || [];
      for (let i = 0; i < purchaseHistory.length; i++) {
        if (purchaseHistory[i].purchaseType === Const.contentPurchaseTypeExclusive) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCannotUpdateExclusiveProduct,
            message: `UpdateProductControllerV2, cannot update exclusive product`,
          });
        }
      }

      const { fields, files = {} } = (await Utils.formParse(request)) || {};
      logger.info(`UpdateProductControllerV2 - FIELDS:\n${JSON.stringify(fields)}`);

      const visibilityCheck = checkVisibility({ fields, files, product });
      const {
        name,
        description,
        visibility,
        tribeIds,
        communityIds,
        categoryId,
        linkedProductId,
        audioForExpoId = null,
      } = fields || {};
      let deleteImage = !!+fields.deleteImage || false;
      let publish = false;

      const audioFileNames = !fields.audioFileNames
        ? []
        : fields.audioFileNames.split(",").map((name) => name.trim());

      if (fields.publish) {
        publish = !!+fields.publish;
      }
      if (fields.allowPublicComments !== undefined) {
        product.allowPublicComments = !!+fields.allowPublicComments;
      }
      if (fields.appropriateForKids !== undefined) {
        product.appropriateForKids = !!+fields.appropriateForKids;
      }
      if (name && name !== product.name) {
        product.name = name;
      }
      if (fields.language && fields.language !== product.language) {
        product.language = isLanguageValid(fields.language || request.user.deviceLanguage)
          ? fields.language || request.user.deviceLanguage
          : "en";
      }

      if (fields.availableForExpo) {
        const availableForExpo =
          fields.availableForExpo === "1" && product.type === Const.productTypePodcast;
        product.availableForExpo = availableForExpo;
      }

      if (linkedProductId) {
        if (product.linkedProductId && linkedProductId === '""') {
          product.linkedProductId = undefined;
        } else {
          const linkedProduct = await Product.findOne({ _id: linkedProductId }).lean();
          if (!linkedProduct) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeLinkedProductNotFound,
              message: `UpdateProductControllerV2, linked product not found`,
            });
          }
          product.linkedProductId = linkedProductId;
        }
      }

      if (
        description &&
        description !== product.description &&
        [1, 4].indexOf(product.type) !== -1
      ) {
        product.description = description;
      }

      if (
        product.type === Const.productTypePodcast &&
        (fields.priceSingle || fields.priceUnlimited || fields.priceExclusive)
      ) {
        const originalPrice = {
          countryCode: "SAT",
          currency: "SAT",
        };

        if (fields.priceSingle && !!+fields.priceSingle) {
          originalPrice.singleValue = Math.floor(+fields.priceSingle);
        }
        if (fields.priceUnlimited && !!+fields.priceUnlimited) {
          originalPrice.unlimitedValue = Math.floor(+fields.priceUnlimited);
        }
        if (fields.priceExclusive && !!+fields.priceExclusive) {
          originalPrice.exclusiveValue = Math.floor(+fields.priceExclusive);
        }

        product.originalPrice = originalPrice;
      }

      let category, parentCategory;
      if (categoryId && categoryId !== product.categoryId) {
        if (!Utils.isValidObjectId(categoryId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductInvalidCategoryId,
            message: `UpdateProductControllerV2, categoryId is not a valid id`,
          });
        }

        category = await Category.findOne({ _id: categoryId }).lean();
        if (!category) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductCategoryNotFound,
            message: `UpdateProductControllerV2, category not found`,
          });
        }

        if (
          !Utils.checkProductCategoryGroup({
            productType: product.type,
            categoryGroups: category.group,
          })
        ) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductInvalidCategory,
            message: `UpdateProductControllerV2, invalid category`,
          });
        }
        product.categoryId = categoryId;

        const parentCategoryId = category.parentId;
        if (parentCategoryId !== "-1") {
          parentCategory = await Category.findOne({ _id: parentCategoryId }).lean();
        }
        product.parentCategoryId = parentCategoryId;
      }

      const type = product.type;
      const productFiles = product.file;

      const { err } = await handleAudiosForExpo({
        audioForExpoId,
        audioFileNames,
        userId: request.user._id.toString(),
        product: product.toObject(),
      });

      if (err) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeAddingAudioForExpoFailed,
          message: `UpdateProductControllerV2, adding audio for expo failed`,
        });
      }

      if ([3, 4].indexOf(type) !== -1 && deleteImage) {
        const fileToDelete = getFileToDelete({ productFiles, fileType: 0 });
        await deleteFile(fileToDelete);
        productFiles.splice(fileToDelete.index, 1);
      }

      if (
        visibility &&
        (visibility !== product.visibility ||
          (tribeIds && tribeIds !== product.tribeIds) ||
          (communityIds && communityIds !== product.communityIds))
      ) {
        if (Const.productVisibilities.indexOf(visibility) === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeWrongVisibilityParameter,
            message: `UpdateProductControllerV2, wrong visibility parameter`,
          });
        }
        product.visibility = visibility;

        if (visibility === Const.productVisibilityTribes) {
          if (!tribeIds || tribeIds === "") {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeNoTribeIds,
              message: `UpdateProductControllerV2, no tribeIds parameter`,
            });
          }
          const tribeIdsArray = tribeIds.split(",");

          const { code, message } =
            (await checkTribeVisibility({
              tribeIds: tribeIdsArray,
              requestUserId,
            })) || {};
          if (code) {
            return Base.newErrorResponse({
              response,
              code,
              message: `UpdateProductControllerV2, ${message}`,
            });
          }

          product.tribeIds = tribeIdsArray;
        } else if (visibility !== Const.productVisibilityTribes) {
          product.tribeIds = [];
        }
        if (visibility === Const.productVisibilityCommunity) {
          if (!communityIds || communityIds === "") {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeMembershipNotFound,
              message: `UpdateProductControllerV2, no communityIds parameter`,
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
              message: `UpdateProductControllerV2, ${message}`,
            });
          }

          product.communityIds = communityIdsArray;
        } else if (visibility !== Const.productVisibilityCommunity) {
          product.communityIds = [];
        }
      }

      if (publish && product.moderation.status === Const.moderationStatusDraft) {
        const { code, message } = checkDraftProduct(product) || {};
        if (code) {
          return Base.newErrorResponse({
            response,
            code,
            message: `UpdateProductControllerV2, ${message}`,
          });
        }

        product.moderation.status =
          user.merchantApplicationStatus === Const.merchantApplicationStatusApprovedWithPayout
            ? Const.moderationStatusApproved
            : Const.moderationStatusPending;
        product.created = Utils.now();
      } else if (!visibilityCheck && product.moderation.status === Const.moderationStatusApproved) {
        product.moderation.status =
          user.merchantApplicationStatus === Const.merchantApplicationStatusApprovedWithPayout
            ? Const.moderationStatusApproved
            : Const.moderationStatusPending;
      } else if (
        product.moderation.status !== Const.moderationStatusDraft &&
        product.moderation.status !== Const.moderationStatusApproved &&
        product.moderation.status !== Const.moderationStatusApprovalNeeded &&
        !deleteImage
      ) {
        product.moderation.status =
          user.merchantApplicationStatus === Const.merchantApplicationStatusApprovedWithPayout
            ? Const.moderationStatusApproved
            : Const.moderationStatusPending;
      }

      const { tags } = fields;
      if (tags !== undefined && tags !== product.tags) {
        const { tags: tagsString, tagIds: tagsArray } = await handleTags({
          oldTags: product.tags,
          newTags: tags,
        });

        product.tags = tagsString;
        product.hashtags = tagsArray;
      }

      product.modified = Date.now();
      await product.save();

      try {
        await recombee.upsertProduct({ product: product.toObject() });
      } catch (error) {
        logger.error("UpdateProductControllerV2, recombee", error);
      }

      const fileKeys = Object.keys(files);
      if (fileKeys.length) {
        processMedia({ productId, fileKeys, files, productFiles, type });
      }

      const productObj = product.toObject();

      const owner = await User.findOne({ _id: productObj.ownerId }, Const.userSelectQuery).lean();
      if (owner && !owner.avatar) {
        owner.avatar = {};
      }
      productObj.owner = owner;

      if (category) {
        productObj.category = category;
      } else {
        productObj.category = await Category.findOne({ _id: product.categoryId }).lean();
      }

      if (parentCategory) {
        productObj.parentCategory = parentCategory;
      } else if (product.parentCategoryId && product.parentCategoryId !== "-1") {
        productObj.parentCategory = await Category.findOne({
          _id: product.parentCategoryId,
        }).lean();
      }

      await handleAudioForExpoPostProcessing({ product });

      Base.successResponse(response, Const.responsecodeSucceed, {
        product: productObj,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "UpdateProductControllerV2",
        error,
      });
    }
  },
);

function getFileToDelete({ productFiles, fileType }) {
  for (let m = 0; m < productFiles.length; m++) {
    const fileToDelete = productFiles[m];
    if (fileToDelete.fileType === fileType) {
      fileToDelete.index = m;
      return fileToDelete;
    }
  }
}

function checkParams(reqParams, productParams) {
  let count = true;
  Object.keys(productParams).forEach((key) => {
    if (reqParams[key] && productParams[key] !== reqParams[key]) {
      count = false;
    }
  });
  return count;
}

function checkVisibility({ fields, files, product }) {
  const { visibility, tribeIds, publish, deleteImage, ...reqParams } = fields;
  const { name, description, categoryId } = product;
  const productParams = { name, description, categoryId };

  if (deleteImage || Object.keys(files).length > 0) {
    return false;
  }

  if (
    visibility !== product.visibility &&
    (Object.keys(reqParams).length === 0 || checkParams(reqParams, productParams))
  ) {
    return true;
  }

  return false;
}

async function handleAudiosForExpo({
  audioForExpoId = null,
  audioFileNames = [],
  userId,
  product,
}) {
  try {
    if (product.audioForExpoInfo && !audioForExpoId) {
      product.audioForExpoInfo = undefined;
      return {};
    }

    if (product.audiosForExpo && product.audiosForExpo.length > 0 && audioFileNames.length === 0) {
      product.audiosForExpo = [];
      return {};
    }

    if (!audioForExpoId && audioFileNames.length === 0) {
      return {};
    }

    if (audioForExpoId === product.audioForExpoInfo?.audioId) {
      return {};
    }

    const currentAudioNames =
      !product.audiosForExpo || product.audiosForExpo.length === 0
        ? []
        : product.audiosForExpo.map((a) => a.nameOnServer);
    currentAudioNames.sort();
    const newAudioNames = audioFileNames;
    newAudioNames.sort();
    if (util.isDeepStrictEqual(currentAudioNames, newAudioNames)) {
      return {};
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
            `UpdateProductControllerV2, handleAudiosForExpo, audioForExpoId ${audioForExpoId} not found`,
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
      logger.error(`UpdateProductControllerV2, handleAudiosForExpo, no audios found?`);
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
            `UpdateProductControllerV2, handleAudiosForExpo, audio product not available to user`,
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

    product.audioForExpoInfo = resultArray[0];
    product.audiosForExpo = resultArray;

    return {};
  } catch (error) {
    logger.error("UpdateProductControllerV2, handleAudiosForExpo", error);
    return { err: 1 };
  }
}

async function handleAudioForExpoPostProcessing({ product = null }) {
  if (!product) {
    logger.error("UpdateProductControllerV2, handleAudiosForExpo, no product");
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

async function processMedia({ productId, fileKeys, files, productFiles, type }) {
  try {
    await Product.findByIdAndUpdate(productId, {
      mediaProcessingInfo: {
        status: "processing",
      },
    });

    for (let i = 0; i < fileKeys.length; i++) {
      const file = files[fileKeys[i]];
      const fileMimeType = file.type;
      let fileData, fileToDelete;

      if (fileMimeType.indexOf("video") !== -1) {
        try {
          if ([1, 2].indexOf(type) === -1) {
            await handleProcessingError({
              productId,
              error: "video file not supported for this type",
            });
            return;
          }

          fileData = await handleVideoFile(file);

          fileToDelete = getFileToDelete({ productFiles, fileType: 1 });
          if (fileToDelete) {
            await deleteFile(fileToDelete);
          }
        } catch (error) {
          await handleProcessingError({ productId, error: "error with video file" });
          return;
        }
      } else if (fileMimeType.indexOf("image") !== -1) {
        if ([3, 4].indexOf(type) === -1) {
          await handleProcessingError({
            productId,
            error: "image file not supported for this type",
          });
          return;
        }

        fileToDelete = getFileToDelete({ productFiles, fileType: 0 });
        if (fileToDelete) {
          await deleteFile(fileToDelete);
        }

        fileData = await handleImageFile(file);
      } else if (fileMimeType.indexOf("audio") !== -1) {
        if (type !== 3) {
          await handleProcessingError({
            productId,
            error: "audio file not supported for this type",
          });
          return;
        }

        fileToDelete = getFileToDelete({ productFiles, fileType: 2 });
        if (fileToDelete) {
          await deleteFile(fileToDelete);
        }

        fileData = await handleAudioFile(file);
      } else {
        //invalid file for the product type. Skip to next file
        logger.info(`UpdateProductControllerV2, invalid file with mime type: ${fileMimeType}`);
        continue;
      }
      if (fileToDelete) {
        fileData.order = fileToDelete.order;
        productFiles.splice(fileToDelete.index, 1, fileData);
      } else {
        fileData.order = productFiles.length;
        productFiles.push(fileData);
      }
    }
  } catch (error) {
    await handleProcessingError({ productId, error: error.message });
    return;
  }

  logger.info(`UpdateProductControllerV2, product ${productId} media processing completed`);
  await Product.findByIdAndUpdate(productId, {
    file: productFiles,
    mediaProcessingInfo: {
      status: "completed",
    },
  });

  return;
}

async function handleProcessingError({ productId, error }) {
  logger.error(`UpdateProductControllerV2, product ${productId} media processing error: ${error}`);

  await Product.findByIdAndUpdate(productId, {
    mediaProcessingInfo: { status: "failed", error },
  });

  return;
}

module.exports = router;
