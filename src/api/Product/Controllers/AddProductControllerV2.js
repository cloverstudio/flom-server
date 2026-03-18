"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Category, Product, User, ApiAccessLog } = require("#models");
const { handleTags } = require("#logics");
const { recombee } = require("#services");
const mediaHandler = require("#media");
const fsp = require("fs/promises");
const fs = require("fs");
const sharp = require("sharp");
const { checkTribeVisibility, checkCommunityVisibility, isLanguageValid } = require("../helpers");

/**
 * @api {post} /api/v2/product/add/new Add Product v2 flom_v1
 * @apiVersion 2.0.23
 * @apiName Add Product v2 flom_v1
 * @apiGroup WebAPI Products
 * @apiDescription API for creating a new product. NOTE! This new API uses new media processing logic.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productName productName
 * @apiParam {String} [productCategoryId] productCategoryId (left for backwards compatibility)
 * @apiParam {String} [categoryId] Same as productCategoryId. Ignores productCategoryId if present. Defaults to default category
 * @apiParam {String} productDescription productDescription
 * @apiParam {file} productImage file
 * @apiParam {String} priceCountryCode country code of product's original price
 * @apiParam {String} priceCurrency Currency of product's original price
 * @apiParam {Number} priceValue Value of product's original price
 * @apiParam {Number} priceMinValue Minimum value of product's original price
 * @apiParam {Number} priceMaxValue Maximum value of product's original price
 * @apiParam {Number} isNegotiable isNegotiable 1 or 0
 * @apiParam {Number} itemCount itemCount
 * @apiParam {Number} productPrice productPrice (DEPRECATED)
 * @apiParam {Number} minPrice minPrice (DEPRECATED)
 * @apiParam {Number} maxPrice maxPrice (DEPRECATED)
 * @apiParam {String} location location - string "longitude,latitude"
 * @apiParam {String} updateUserLocation updateUserLocation - 1 or 0
 * @apiParam {Number} localMin localMin (DEPRECATED)
 * @apiParam {Number} localMax localMax (DEPRECATED)
 * @apiParam {Number} localAmount localAmount (DEPRECATED)
 * @apiParam {String} currencyCode currencyCode (DEPRECATED)
 * @apiParam {String} currencySymbol currencySymbol (DEPRECATED)
 * @apiParam {String} currencyCountryCode currencyCountryCode (DEPRECATED)
 * @apiParam {String} [type] type of the product: 1 - video, 2 - quick video, 3 - podcast, 4 - text story, 5 - product. Defaults to product.
 * Is converted to Number for model.
 * @apiParam {String} [colorId] colorId
 * @apiParam {String} [genderId] genderId
 * @apiParam {String} [sizeId] sizeId
 * @apiParam {String} [condition] condition (New, Used, Damaged)
 * @apiParam {String} [priceRange] priceRange
 * @apiParam {String} productMainCategoryId productMainCategoryId
 * @apiParam {String} productSubCategoryId productSubCategoryId
 * @apiParam {String} [productTypeId] productTypeId
 * @apiParam {String} [productMakeId] productMakeId
 * @apiParam {String} [productModelId] productModelId
 * @apiParam {String} [subTypeId] subTypeId
 * @apiParam {String} [showYear] showYear
 * @apiParam {Number} [vehicleYear] vehicleYear
 * @apiParam {Number} [year] year
 * @apiParam {String} [brandId] brandId
 * @apiParam {String} [tags] Tags (e.g. "#wedding #weedingdress #white #silk")
 * @apiParam {String} [visibility] Visibility of the product: "public", "tribes" or "community". Defaults to "public". Tribe products are shared with tribes only, tribeIds are required in this case. Community products are shared with community only, visible but locked for those who are not part of the community.
 * @apiParam {String} [tribeIds] Comma separated string of tribe ids  with who to share the product with. Required if visibility is set to "tribes".
 * @apiParam {String} [communityIds] Comma separated string of community ids  with who to share the product with. Required if visibility is set to "community"
 * @apiParam {String} [isDraft] Is product a draft 0 - false, 1 - true. Defaults to false
 * @apiParam {String} [appropriateForKids] Is video appropriate for kids 0 - false, 1 - true
 * @apiParam {Number} [allowEngagementBonus] allow engagement bonus (1 if true) (default: false)
 * @apiParam {Number} [engagementBudgetCredits] engagement budget in credits
 * @apiParam {Number} [creditsPerLinkedExpo] number of credits to award for interaction in expo
 * @apiParam {String} [language] language of the product (default is user's device language)
 *
 * @apiSuccessExample {json} Success-Response
 * {
 *  "code": 1,
 *  "time": 1542971764382,
 *  "data": {
 *      "image": [],
 *      "_id": "5bf7e172ae0e12313c956496",
 *      "name": "imeproizvoda",
 *      "parentCategoryId": "5bd98dfa0bb237660b06115a",
 *      "categoryId": "5bd98dfa0bb237660b06115a",
 *      "description": "adesc",
 *      "hashtags": [
 *            "car",
 *            "vw",
 *            "dasauto"
 *      ],
 *      "price": 10,
 *      "ownerId": "5bd05466e42d857e2a42a307",
 *      "created": 1542971762984,
 *      "status": 1,
 *      "type": 5, // product
 *      "__v": 0,
 *      "engagementBonus": {
 *             "allowed": true/false,
 *             "budgetCredits": 1000,
 *             "creditsPerLinkedExpo": 10
 *      },
 *      "owner": {
 *          "avatar": {
 *              "picture": {
 *                  "originalName": "scaled_20190131_112506.jpg",
 *                  "size": 586494,
 *                  "mimeType": "image/png",
 *                  "nameOnServer": "npUVDZilndqDqLZD0hldo84vaNjXytAr"
 *              },
 *              "thumbnail": {
 *                  "originalName": "scaled_20190131_112506.jpg",
 *                  "size": 83800,
 *                  "mimeType": "image/png",
 *                  "nameOnServer": "S2aFbwRcpF2gssZal8S5SEIkzAtVI3fn"
 *              }
 *          },
 *          "bankAccounts": [
 *              {
 *                  "_id": "5c518e701a08a651013e63dd",
 *                  "name": "GTB",
 *                  "accountNumber": "017****910",
 *                  "code": "000013",
 *                  "merchantCode": "40210229",
 *                  "selected": true
 *              }
 *          ],
 *          "location": {
 *              "coordinates": [
 *                  15.956714227795601,
 *                  45.80470714793682
 *              ],
 *              "type": "Point"
 *          },
 *          "locationVisibility": false,
 *          "workingHours": {
 *              "start": "12.00",
 *              "end": "14.00"
 *          },
 *          "_id": "5c518be51a08a651013e63dc",
 *          "name": "Business",
 *          "phoneNumber": "+2348101958509",
 *          "aboutBusiness": "tictic jf gjtk tk. tj tjtj. rjrj rj rj r nr m tm tm tm",
 *          "created": 1540834941603
 *      },
 *      "category": {
 *        "_id": "5ca458e731780ea12c79f6f2",
 *        "name": "Security Fencing",
 *        "parentId": "5ca44d7208f8045e4e3471e1",
 *        "group": [
 *          1
 *        ]
 *      },
 *      "parentCategory": {
 *        "_id": "5ca44d7208f8045e4e3471e1",
 *        "name": "Security Services",
 *        "parentId": "-1",
 *        "group": [
 *          1
 *        ]
 *      }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400128 Not a valid categoryId
 * @apiError (Errors) 400129 Category not found
 * @apiError (Errors) 400131 Invalid category for this product type
 * @apiError (Errors) 443228 Invalid visibility parameter
 * @apiError (Errors) 443490 No tribe ids parameter
 * @apiError (Errors) 443473 One or more tribe ids is invalid
 * @apiError (Errors) 443474 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443487 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443240 One or more community ids is invalid
 * @apiError (Errors) 443241 One or more communities (from communityIds) is not found
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 4000060 Users products blocked and user is blocked from creating new products
 * @apiError (Errors) 400162 Link not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    let { fields, files } = await Utils.formParse(request);

    if (fields.productPrice || fields.maxPrice || fields.minPrice) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAppVersionTooOld,
        message: `AddProductControllerV2, deprecated parameters, app too old`,
      });
    }

    logger.info("AddProductControllerV2, device type: " + request.headers["device-type"]);
    logger.info("AddProductControllerV2, fields: " + JSON.stringify(fields));

    const user = request.user;
    if (user.blockedProducts) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserBlocked,
        message: `AddProductControllerV2, user blocked`,
      });
    }

    const productName = fields.productName;
    const productCategoryId =
      fields.categoryId || fields.productCategoryId || "5bd98d220bb237660b061159";
    const productDescription = fields.productDescription;
    const language = isLanguageValid(fields.language || request.user.deviceLanguage)
      ? fields.language || request.user.deviceLanguage
      : "en";

    const type = +fields.type || 5;

    let priceCountryCode = fields.priceCountryCode;
    let priceCurrency = fields.priceCurrency;
    let priceValue = type === Const.productTypeProduct ? +fields.priceValue || -1 : -1;
    let priceMinValue = type === Const.productTypeProduct ? +fields.priceMinValue || -1 : -1;
    let priceMaxValue = type === Const.productTypeProduct ? +fields.priceMaxValue || -1 : -1;

    const isNegotiable = fields.isNegotiable == 1 || fields.isNegotiable == "true" ? true : false;
    const itemCount = fields.itemCount || -1;

    const visibility = fields.visibility || Const.defaultProductVisibility;
    const tribeIds = fields.tribeIds;
    const communityIds = fields.communityIds;
    let isDraft = false;
    let appropriateForKids;

    if (fields.isDraft) {
      isDraft = !!+fields.isDraft;
    }
    if (fields.appropriateForKids) {
      appropriateForKids = !!+fields.appropriateForKids;
    }

    if (type !== Const.productTypeProduct) {
      const conversionRates = await Utils.getConversionRates();

      priceCountryCode =
        user.countryCode ?? Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });

      priceCurrency = Utils.getCurrencyFromCountryCode({
        countryCode: priceCountryCode,
        rates: conversionRates.rates,
      });
    }

    const originalPrice = {
      countryCode: priceCountryCode,
      currency: priceCurrency,
      value: priceValue,
      minValue: priceMinValue,
      maxValue: priceMaxValue,
    };

    const {
      colorId,
      genderId,
      sizeId,
      condition,
      priceRange,
      productMainCategoryId,
      productSubCategoryId,
      productTypeId,
      productMakeId,
      productModelId,
      subTypeId,
      lat,
      lng,
      location: locationStr,
      showYear,
      vehicleYear,
      year,
      brandId,
    } = fields;

    let product = new Product();
    let parentCategory, category;

    if (productCategoryId) {
      if (!Utils.isValidObjectId(productCategoryId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductInvalidCategoryId,
          message: `AddProductControllerV2, categoryId is not a valid id`,
        });
      }

      category = await Category.findOne({ _id: productCategoryId }).lean();
      if (!category) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCategoryNotFound,
          message: `AddProductControllerV2, category not found`,
        });
      }

      if (!Utils.checkProductCategoryGroup({ productType: type, categoryGroups: category.group })) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeProductInvalidCategory,
          message: `AddProductControllerV2, invalid category`,
        });
      }

      const parentCategoryId = category.parentId;
      if (parentCategoryId !== "-1") {
        parentCategory = await Category.findOne({ _id: parentCategoryId }).lean();
      }

      product.categoryId = productCategoryId;
      product.parentCategoryId = parentCategoryId;
      product.productMainCategoryId = undefined;
      product.productSubCategoryId = undefined;
      //product = await Utils.syncProductsCategories(product);
    } else if (productMainCategoryId || productSubCategoryId) {
      if (productMainCategoryId) {
        product.productMainCategoryId = productMainCategoryId;
      }
      product.productSubCategoryId = productSubCategoryId;
      product = await Utils.syncProductsCategories(product);
    }

    const updateUserLocation =
      fields.updateUserLocation == 1 || fields.updateUserLocation == "true" ? true : false;
    let location;

    if (lat && lng) {
      location = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      };
    } else if (locationStr) {
      const locationArr = locationStr.split(",");

      location = {
        type: "Point",
        coordinates: [+locationArr[0], +locationArr[1]],
      };
    } else {
      location = user.location;
    }

    if (location) {
      product.location = location;

      const { coordinates = [0, 0] } = location;

      if (coordinates[0] !== 0 || coordinates[1] !== 0) {
        await ApiAccessLog.create({
          type: "LocationIQ",
          api: "AddProductControllerV2",
          userName: request.user.userName,
          createdDate: new Date(),
        });

        const address = await Utils.getAddressFromCoordinates({
          lat: coordinates[1],
          lon: coordinates[0],
        });

        product.address = address;
      }
    }

    if (!productName && !isDraft)
      return Base.successResponse(response, Const.responsecodeProductNoProductName);

    if (!productCategoryId && !productMainCategoryId && !isDraft)
      return Base.successResponse(response, Const.responsecodeProductNoProductCategoryId);

    if (!productDescription && !isDraft)
      return Base.successResponse(response, Const.responsecodeProductNoProductDescription);

    if (priceValue === -1 && priceMinValue === -1 && priceMaxValue === -1 && !isDraft)
      return Base.successResponse(response, Const.responsecodeProductNoProductPrice);
    if (Const.productTypes.indexOf(+type) === -1)
      return Base.successResponse(response, Const.responsecodeProductInvalidType);

    if (Const.productVisibilities.indexOf(visibility) === -1) {
      return Base.successResponse(response, Const.responsecodeWrongVisibilityParameter);
    } else if (visibility === Const.productVisibilityTribes) {
      if (!tribeIds || tribeIds === "") {
        return Base.successResponse(response, Const.responsecodeNoTribeIds);
      }
      const tribeIdsArray = tribeIds.split(",");

      const { code, message } =
        (await checkTribeVisibility({
          tribeIds: tribeIdsArray,
          requestUserId: user._id.toString(),
        })) || {};

      if (code) {
        return Base.newErrorResponse({
          response,
          code,
          message: `AddProductControllerV2, ${message}`,
        });
      }

      product.tribeIds = tribeIdsArray;
    } else if (visibility === Const.productVisibilityCommunity) {
      if (!communityIds || communityIds === "") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeMembershipNotFound,
          message: `AddProductControllerV2, no communityIds parameter`,
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
          message: `AddProductControllerV2, ${message}`,
        });
      }

      product.communityIds = communityIdsArray;
    }

    product.name = productName;
    product.description = productDescription;
    product.ownerId = user._id;
    product.countryCode = user.countryCode;
    product.created = Utils.now();
    product.status = 1;
    product.itemCount = itemCount;
    product.isNegotiable = isNegotiable;
    product.originalPrice = originalPrice;
    product.type = +type;
    product.visibility = visibility;
    product.moderation = {
      status: isDraft ? Const.moderationStatusDraft : Const.moderationStatusPending,
    };
    product.language = language;

    if (brandId) product.brandId = brandId;
    if (colorId) product.colorId = colorId;
    if (genderId) product.genderId = genderId;
    if (sizeId) product.sizeId = sizeId;
    if (condition) product.condition = condition;
    if (priceRange) product.priceRange = priceRange;
    if (productTypeId) product.productTypeId = productTypeId;
    if (productMakeId) product.productMakeId = productMakeId;
    if (productModelId) product.productModelId = productModelId;
    if (subTypeId) product.subTypeId = subTypeId;
    if (showYear) product.showYear = showYear;
    if (vehicleYear) product.vehicleYear = vehicleYear;
    if (year) product.year = year;
    if (appropriateForKids) product.appropriateForKids = appropriateForKids;

    const tagsInput = fields.tags;
    if (tagsInput !== undefined) {
      const { tags: tagsString, tagIds: tagsArray } = await handleTags({ newTags: tagsInput });

      product.tags = tagsString;
      product.hashtags = tagsArray;
    }

    const allowEngagementBonus = fields.allowEngagementBonus == "1";
    product.engagementBonus = { allowed: allowEngagementBonus, allowEngagementBonus };

    if (allowEngagementBonus) {
      const engagementBudgetCredits =
        !fields.engagementBudgetCredits || isNaN(+fields.engagementBudgetCredits)
          ? 0
          : +fields.engagementBudgetCredits;
      if (engagementBudgetCredits > user.creditBalance) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreditsEngagementBonusLargerThanCreditBalance,
          message: `AddProductControllerV2, engagement budget in credits larger than credits balance`,
        });
      }
      product.engagementBonus.budgetCredits = engagementBudgetCredits;
      product.engagementBonus.engagementBudgetCredits = engagementBudgetCredits;

      const creditsPerLinkedExpo =
        !fields.creditsPerLinkedExpo || isNaN(+fields.creditsPerLinkedExpo)
          ? 0
          : +fields.creditsPerLinkedExpo;
      product.engagementBonus.creditsPerLinkedExpo = creditsPerLinkedExpo;
      product.engagementBonus.creditsPerLinkedExpo = creditsPerLinkedExpo;
    }

    await product.save();

    try {
      await recombee.upsertProduct({ product: product.toObject() });
    } catch (error) {
      logger.error(`AddProductControllerV2, ${product._id.toString()}, recombee`, error);
    }

    processMedia({ productId: product._id.toString(), files });

    if (updateUserLocation) {
      user.location = location;
      await user.save();
    }

    let productObj = product.toObject();
    productObj.owner = await User.findOne(
      {
        _id: request.user._id,
      },
      Const.userSelectQuery,
    ).lean();

    productObj.category = category;
    if (category.parentId !== "-1") {
      productObj.parentCategory = parentCategory;
    }

    Base.successResponse(response, Const.responsecodeSucceed, productObj);
  } catch (e) {
    if (e.message === "Error while compressing video file") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeCompressingVideoFailed,
        message: "AddProductControllerV2, compressing video failed",
      });
    }
    Base.errorResponse(response, Const.httpCodeServerError, "AddProductControllerV2", e);
    return;
  }
});

async function processMedia({ productId, files }) {
  let allFiles = [];
  let order = -1;
  let fileType = null;

  try {
    if (Object.keys(files).length > 0) {
      for (let file in files) {
        const tempPath = files[file].path;
        const fileName = files[file].name;
        let fileMimeType = files[file].type;

        const destPath = Config.uploadPath + "/";
        const newFileName = Utils.getRandomString(32);
        const thumbFileName = Utils.getRandomString(32);
        const hslName = Utils.getRandomString(32);
        let convertToHslSuccess = false;

        let width = null;
        let height = null;
        let aspectRatio = null;
        let thumbMimeType = null;
        let duration = null;
        let fileSize = null;
        let thumbSize = null;
        order++;

        if (fileMimeType.indexOf("video") > -1) {
          //rotate video if necessary

          let dur;

          try {
            const inputMetadata = await mediaHandler.getMediaInfo(tempPath);
            logger.info(
              "AddProductControllerV2, original file metadata: " + JSON.stringify(inputMetadata),
            );

            dur = inputMetadata.duration;
          } catch (error) {
            logger.error("AddProductControllerV2, original file metadata", error);
          }

          let keyFramesList = "2,6,10",
            segmentTimesList = "1,5,9";

          const repeatFactor = dur > 10 ? Math.ceil((dur - 10) / 10) : 0;
          for (let i = 1; i <= repeatFactor; i++) {
            keyFramesList += `,${i * 10 + 10}`;
            segmentTimesList += `,${i * 10 + 9}`;
          }

          await Utils.compressVideo({
            originalFilePath: tempPath,
            destinationPath: destPath,
            newFileName,
            keyFramesList,
          });

          const originalVideoMetadata = await mediaHandler.getMediaInfo(
            destPath + newFileName + "_compressed.mp4",
          );

          try {
            logger.info(
              "AddProductControllerV2, compressed file metadata: " +
                JSON.stringify(originalVideoMetadata),
            );
          } catch (error) {
            logger.error("AddProductControllerV2, compressed file metadata", error);
          }

          let rotation = originalVideoMetadata.rotation;
          if (rotation) {
            await Utils.rotateVideo(
              destPath + newFileName + "_compressed.mp4",
              destPath + newFileName + ".mp4",
              rotation,
            );

            try {
              const rotatedMetadata = await mediaHandler.getMediaInfo(
                destPath + newFileName + ".mp4",
              );
              logger.info(
                "AddProductControllerV2, rotated file metadata: " + JSON.stringify(rotatedMetadata),
              );
            } catch (error) {
              logger.error("AddProductControllerV2, rotated file metadata", error);
            }
          } else {
            await fsp.copyFile(
              destPath + newFileName + "_compressed.mp4",
              destPath + newFileName + ".mp4",
            );
          }

          //get video dimensions
          const dimensions = await mediaHandler.getVideoInfo(destPath + newFileName + ".mp4");
          width = dimensions.width;
          height = dimensions.height;

          aspectRatio = Utils.roundNumber(width / height, 5);

          //file is already rotated and copied to the right place with new name so it can be deleted
          await fsp.unlink(destPath + newFileName + "_compressed.mp4");

          try {
            await Utils.convertToHSL(
              destPath + newFileName + ".mp4",
              destPath + hslName,
              segmentTimesList,
            );
            convertToHslSuccess = true;
          } catch (error) {
            convertToHslSuccess = false;
          }
          fileSize = files[file].size;
          const fileInfo = await mediaHandler.getMediaInfo(files[file].path);
          duration = fileInfo.duration;
          fileType = 1;

          let thumb = await Utils.getVideoScreenshots(
            destPath,
            thumbFileName,
            newFileName,
            duration,
          );
          thumbMimeType = thumb.thumbMimeType;
          thumbSize = thumb.thumbSize;
        }

        if (fileMimeType.indexOf("image") > -1) {
          //get image dimensions
          const dimensions = await mediaHandler.getImageInfo(tempPath);
          width = dimensions.width;
          height = dimensions.height;

          await sharp(tempPath).toFile(destPath + newFileName + ".jpg");

          fileType = 0;
          duration = 0;

          let newFile = fs.statSync(destPath + newFileName + ".jpg");

          fileMimeType = "image/jpeg";
          fileSize = newFile.size;

          let thumb = await Utils.generateImageThumbnail(
            newFile,
            newFileName + ".jpg",
            thumbFileName + ".jpg",
          );

          thumbSize = thumb.image.size;
          thumbMimeType = "image/jpeg";
          aspectRatio = thumb.originalRatio;

          //await rename(thumb.destPathTmp + ".jpg", thumb.destPathTmp);
        }

        allFiles.push({
          file: {
            originalName: fileName,
            size: fileSize,
            mimeType: fileMimeType,
            nameOnServer: newFileName + ".jpg",
            ...(fileMimeType.indexOf("video") > -1 && {
              hslName: convertToHslSuccess ? hslName : "",
              duration: duration,
            }),
            width,
            height,
            aspectRatio,
          },
          thumb: {
            originalName: fileName,
            size: thumbSize,
            mimeType: thumbMimeType,
            nameOnServer: thumbFileName + ".jpg",
          },
          order: order,
          fileType: fileType,
        });
      }
    }
  } catch (error) {
    await handleProcessingError({ productId, error: error.message });
    return;
  }

  logger.info(`AddProductControllerV2, product ${productId} media processing completed`);

  const updateObj = {
    file: allFiles,
    mediaProcessingInfo: {
      status: "completed",
    },
  };

  await Product.findByIdAndUpdate(productId, updateObj);

  return;
}

async function handleProcessingError({ productId, error }) {
  logger.error(`AddProductControllerV2, product ${productId} media processing error: ${error}`);

  await Product.findByIdAndUpdate(productId, {
    mediaProcessingInfo: { status: "failed", error },
  });

  return;
}

module.exports = router;
