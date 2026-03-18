"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Category, Product, User } = require("#models");
const { handleTags } = require("#logics");
const { recombee } = require("#services");
const mediaHandler = require("#media");
const fsp = require("fs/promises");
const fs = require("fs");
const sharp = require("sharp");
const {
  checkTribeVisibility,
  checkCommunityVisibility,
  checkDraftProduct,
  isLanguageValid,
} = require("../helpers");

/**
 * @api {patch} /api/v2/product/edit/new Edit Product v2 flom_v1
 * @apiVersion 2.0.23
 * @apiName Edit Product v2 flom_v1
 * @apiGroup WebAPI
 * @apiDescription Edit Product v2
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} productId productId
 * @apiParam {File[]} [file] files
 * @apiParam {String} [fileOrder] comma-separated product file Ids in user's preferred order ('5dd3b2ae74e7ca3f9b144227,5dd3b2ae74e7ca3f9b144228')
 * @apiParam {String} [filesToDelete] comma-separated product file Ids for deletion ('5dd3b2ae74e7ca3f9b144227,5dd3b2ae74e7ca3f9b144228')
 * @apiParam {String} [productName] productName
 * @apiParam {String} [productCategoryId] productCategoryId. Backwards compatibility
 * @apiParam {String} [categoryId] categoryId. Ignores productCategoryId if present
 * @apiParam {String} [productDescription] productDescription
 * @apiParam {Number} [originalPrice] Value of the product's original price in its original currency
 * @apiParam {Number} [originalMinPrice] Value of the product's minimum original price in its original currency
 * @apiParam {Number} [originalMaxPrice] Value of the product's maximum original price in its original currency
 * @apiParam {Number} [isNegotiable] isNegotiable 1 or 0
 * @apiParam {Number} [itemCount] itemCount
 * @apiParam {String} [location] location - string "longitude,latitude"
 * @apiParam {String} [tags] tags
 * @apiParam {String} [condition] condition (New, Used, Damaged)
 * @apiParam {String} [visibility] Visibility of the product: "public" or "tribes". Defaults to "public". Tribe products are shared with tribes only, tribeIds are required in this case.
 * @apiParam {String} [tribeIds] Comma separated string of tribe ids  with who to share the product with. Required if visibility is set to "tribes".
 * @apiParam {String} [publish] Publish the draft 0 - false, 1 - true. Defaults to false. There will be check if product has all necessary fields
 * @apiParam {String} [appropriateForKids] Is video appropriate for kids 0 - false, 1 - true
 * @apiParam {Number} [allowEngagementBonus] allow engagement bonus (1 if true, 0 if false)
 * @apiParam {Number} [engagementBudgetCredits] engagement budget in credits
 * @apiParam {Number} [creditsPerLinkedExpo] number of credits to award for interaction in expo
 * @apiParam {String} [language] language of the product (default is user's device language)
 *
 * @apiSuccessExample Success-Response:
 *  {
 *  "code": 1,
 *  "time": 1574164400324,
 *  "data": {
 *      "price": 150,
 *      "file": [],
 *      "image": [],
 *      "location": {
 *          "coordinates": [
 *              3.4632437290022566,
 *              6.4324324324324325
 *          ],
 *          "type": "Point"
 *      },
 *      "minPrice": 12,
 *      "maxPrice": 12,
 *      "localPrice": {
 *          "localMin": 100,
 *          "localMax": 100,
 *          "localAmount": 5000,
 *          "amount": 150,
 *          "minAmount": 12,
 *          "maxAmount": 12,
 *          "currencyCode": "usd",
 *          "currencySymbol": "$",
 *          "currencyCountryCode": "111"
 *      },
 *      "_id": "5dd3b2ae74e7ca3f9b144227",
 *      "name": "testProductAdd",
 *      "categoryId": "5bd98d220bb237660b061159",
 *      "description": "test za add",
 *      "ownerId": "5caf5fe9e9ad4e2e953cb27e",
 *      "created": 1574154926743,
 *      "status": 1,
 *      "tags": "#cars #vw #supercar",
 *      "hashtags": [
 *          "6297360d0794dd546ed51797",
 *          "6297360d0794dd546ed51798",
 *          "62974ab00467a26a2c09176c"
 *      ],
 *      "itemCount": -1,
 *      "isNegotiable": false,
 *      "__v": 0,
 *      "engagementBonus": {
 *             "allowed": true/false,
 *             "budgetCredits": 1000,
 *             "creditsPerLinkedExpo": 10
 *      },
 *      "owner": {
 *          "avatar": {
 *              "picture": {
 *                  "originalName": "scaled_IMG_20180213_204916.jpg",
 *                  "size": 721517,
 *                  "mimeType": "image/png",
 *                  "nameOnServer": "bAQipVSqAMutiaMu6blD4bb5QA4XgjPy"
 *              },
 *              "thumbnail": {
 *                  "originalName": "scaled_IMG_20180213_204916.jpg",
 *                  "size": 58290,
 *                  "mimeType": "image/png",
 *                  "nameOnServer": "jHou4GsPNnbNKtVZLkZKW8yKBZ4uX5GS"
 *              }
 *          },
 *          "bankAccounts": [
 *              {
 *                  "_id": "5ce2876b0ec76464887d5432",
 *                  "merchantCode": "40202221",
 *                  "name": "",
 *                  "accountNumber": "1524755459207",
 *                  "code": "",
 *                  "selected": true
 *              }
 *          ],
 *          "location": {
 *              "type": "Point",
 *              "coordinates": [
 *                  3.4632437290022566,
 *                  6.4324324324324325
 *              ]
 *          },
 *          "locationVisibility": false,
 *          "businessCategory": {
 *              "id": "5ca44cb408f8045e4e3471d9",
 *              "name": "Computers and Phones"
 *          },
 *          "workingHours": {
 *              "start": "9am",
 *              "end": "5pm"
 *          },
 *          "isAppUser": true,
 *          "_id": "5caf5fe9e9ad4e2e953cb27e",
 *          "name": "ChangeIT",
 *          "created": 1554997225553,
 *          "phoneNumber": "+2348031930926",
 *          "aboutBusiness": "TechHub"
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
 *  }
 * }
 *
 * @apiError (Errors) 400128 Not a valid categoryId
 * @apiError (Errors) 400129 Category not found
 * @apiError (Errors) 400131 Invalid category for this product type
 * @apiError (Errors) 400134 Cannot edit currency of product's local price
 * @apiError (Errors) 443228 Invalid visibility parameter
 * @apiError (Errors) 443490 No tribe ids parameter
 * @apiError (Errors) 443473 One or more tribe ids is invalid
 * @apiError (Errors) 443474 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443487 One or more tribes (from tribeIds) is not found
 * @apiError (Errors) 443914 Can't change file order, files are still in processing
 * @apiError (Errors) 443915 Can't change file order, file processing failed
 */

router.patch(
  "/",
  auth({
    allowUser: true,
    allowAdmin: true,
    role: Const.Role.REVIEWER,
  }),
  async function (request, response) {
    try {
      const { fields = {}, files = {} } = await Utils.formParse(request);
      console.log("EditProductControllerV2 fields", fields, "files", files);

      fields.isNegotiable = fields.isNegotiable === undefined ? undefined : +fields.isNegotiable;
      fields.itemCount = !fields.itemCount ? undefined : +fields.itemCount;
      fields.originalPrice = !fields.originalPrice ? undefined : +fields.originalPrice;
      fields.originalMinPrice = !fields.originalMinPrice ? undefined : +fields.originalMinPrice;
      fields.originalMaxPrice = !fields.originalMaxPrice ? undefined : +fields.originalMaxPrice;

      const productId = fields.productId;

      if (!productId || !Utils.isValidObjectId(productId)) {
        return Base.successResponse(response, Const.responsecodeProductNotFound);
      }

      const fileOrderString = fields.fileOrder;
      const fileOrderArray = !fileOrderString ? [] : fileOrderString.split(",");
      const filesToDeleteString = fields.filesToDelete;
      const filesToDeleteArray = !filesToDeleteString ? [] : filesToDeleteString.split(",");
      const user = request.user;
      const requestUserId = user._id.toString();
      const isAdmin = request.isAdmin;

      if (fileOrderString && filesToDeleteString) {
        for (const fileId of filesToDeleteArray) {
          if (fileOrderArray.includes(fileId)) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeFileToDeleteInFileOrderString,
              message:
                "EditProductControllerV2, file set for deletion is present in file order string",
            });
          }
        }
      }

      // get product from db
      let product = await Product.findOne({
        _id: productId,
        isDeleted: false,
      });

      if (!product) {
        return Base.successResponse(response, Const.responsecodeProductNotFound);
      }

      // check if user is owner
      if (product.ownerId != requestUserId && !isAdmin)
        return Base.successResponse(response, Const.responsecodeNotProductOwner);

      // check if price has countrycode & currency
      const conversionRates = await Utils.getConversionRates();

      if (!product.originalPrice.countryCode || !product.originalPrice.currency) {
        product.originalPrice.countryCode =
          product.originalPrice.countryCode ||
          user.countryCode ||
          Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });

        product.originalPrice.currency = Utils.getCurrencyFromCountryCode({
          countryCode: product.originalPrice.countryCode,
          rates: conversionRates.rates,
        });
      }

      //check if visibility is the only parameter modified
      const reqBody = fields;
      const visibilityCheck = checkVisibility({ reqBody, product });

      let publish = false;
      if (fields.publish) {
        publish = !!+fields.publish;
      }

      if (filesToDeleteString) {
        if (product?.mediaProcessingInfo?.status === "processing") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductMediaIsProcessing,
            message: "EditProductControllerV2, product media is processing",
          });
        }
        if (product?.mediaProcessingInfo?.status === "failed") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductMediaProcessingFailed,
            message: "EditProductControllerV2, product media processing failed",
          });
        }

        if (product?.contentPurchaseHistory && product?.contentPurchaseHistory.length > 0) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeAudioProductInUse,
            message: `EditProductControllerV2, audio product is in use by other users`,
          });
        }

        function success(name) {
          return logger.info("EditProductControllerV2: " + name);
        }

        const files = product.file,
          newFiles = [];

        for (const id of filesToDeleteArray) {
          const index = files.findIndex((file) => file._id.toString() === id);

          if (index === -1) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeFileToDeleteNotFound,
              message: `EditProductControllerV2, file to delete ${id} not found in product`,
              param: id,
            });
          }
        }

        let order = 0;

        for (let i = 0; i < files.length; i++) {
          const fileObj = files[i];

          if (filesToDeleteArray.includes(fileObj._id.toString())) {
            const { file, thumb } = fileObj;

            if (file.nameOnServer) {
              const ext = file.mimeType === "video/mp4" ? ".mp4" : "";
              let path = Config.uploadPath + "/" + file.nameOnServer + ext;
              try {
                await fsp.unlink(path);
              } catch (error) {
                logger.error("EditProductControllerV2, error deleting file", error);
              }
              success(file.nameOnServer + ext);
            }

            if (thumb.nameOnServer) {
              let thumbPath = Config.uploadPath + "/" + thumb.nameOnServer;
              try {
                await fsp.unlink(thumbPath);
              } catch (error) {
                logger.error("EditProductControllerV2, error deleting thumb file", error);
              }

              success(thumb.nameOnServer);
            }

            if (file.hslName) {
              const hslPath = Config.uploadPath + "/" + file.hslName + ".m3u8";
              Utils.deleteHslFile(hslPath, success);
            }
          } else {
            fileObj.order = order;
            newFiles.push(fileObj);
            order++;
          }
        }

        product.file = newFiles;
      }

      if (fileOrderString) {
        if (product?.mediaProcessingInfo?.status === "processing") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductMediaIsProcessing,
            message: "EditProductControllerV2, product media is processing",
          });
        }
        if (product?.mediaProcessingInfo?.status === "failed") {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductMediaProcessingFailed,
            message: "EditProductControllerV2, product media processing failed",
          });
        }

        let productFiles = product.file;

        for (const id of fileOrderArray) {
          const index = productFiles.findIndex((file) => file._id.toString() === id);

          if (index === -1) {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeFileToReorderNotFound,
              message: `EditProductControllerV2, file to reorder ${id} not found in product`,
              param: id,
            });
          }
        }

        productFiles = productFiles.map((file) => {
          file.order = fileOrderArray.indexOf(file._id.toString());

          return file;
        });

        productFiles = productFiles.sort((a, b) => a.order - b.order);

        product.file = productFiles;
      }

      // continue
      const productName = fields.productName;
      const productCategoryId = fields.categoryId || fields.productCategoryId;
      const productDescription = fields.productDescription;
      const { originalPrice, originalMinPrice, originalMaxPrice } = fields;
      const isNegotiable = fields.isNegotiable == 1 || fields.isNegotiable == "true" ? true : false;
      const itemCount = fields.itemCount;
      const locationStr = fields.location;

      const lat = fields.lat;
      const lng = fields.lng;
      const brandId = fields.brandId;
      const colorId = fields.colorId;
      const genderId = fields.genderId;
      const sizeId = fields.sizeId;
      const condition = fields.condition;
      const priceRange = fields.priceRange;
      const productMainCategoryId = fields.productMainCategoryId;
      const productSubCategoryId = fields.productSubCategoryId;
      const productTypeId = fields.productTypeId;
      const productMakeId = fields.productMakeId;
      const productModelId = fields.productModelId;
      const subTypeId = fields.subTypeId;
      const showYear = fields.showYear;
      const vehicleYear = fields.vehicleYear;
      const year = fields.year;

      let appropriateForKids = fields.appropriateForKids;

      const { visibility, tribeIds, communityIds } = fields;

      const { tags } = fields;

      let location =
        locationStr == undefined
          ? undefined
          : {
              type: "Point",
              coordinates: locationStr.split(",").map((str) => Number(str)),
            };
      if (lat && lng) {
        location = {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        };
      }

      if (originalPrice && originalPrice !== product.originalPrice.value) {
        product.originalPrice.value = originalPrice;
      }
      if (originalMinPrice && originalMinPrice !== product.originalPrice?.minValue) {
        product.originalPrice.minValue = originalMinPrice;
      }
      if (originalMaxPrice && originalMaxPrice !== product.originalPrice?.maxValue) {
        product.originalPrice.maxValue = originalMaxPrice;
      }

      if (productName && productName !== product.name) product.name = productName;

      let parentCategory, category;
      if (productCategoryId && productCategoryId !== product.categoryId) {
        if (!Utils.isValidObjectId(productCategoryId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeProductInvalidCategoryId,
            message: `EditProductControllerV2, categoryId is not a valid id`,
          });
        }

        category = await Category.findOne({ _id: productCategoryId }).lean();
        if (!category) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeCategoryNotFound,
            message: `EditProductControllerV2, category not found`,
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
            message: `EditProductControllerV2, invalid category`,
          });
        }
        product.categoryId = productCategoryId;

        const parentCategoryId = category.parentId;
        if (parentCategoryId !== "-1") {
          parentCategory = await Category.findOne({ _id: parentCategoryId }).lean();
        }
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
      } else {
        category = await Category.findOne({ _id: product.categoryId }).lean();
      }

      if (productDescription && productDescription !== product.description)
        product.description = productDescription;

      if (isNegotiable != undefined && isNegotiable !== product.isNegotiable)
        product.isNegotiable = isNegotiable;

      if (itemCount != undefined && itemCount !== product.itemCount) product.itemCount = itemCount;

      if (location != undefined && location !== product.location) product.location = location;

      if (appropriateForKids) appropriateForKids = !!+appropriateForKids;

      if (appropriateForKids !== undefined && appropriateForKids !== product.appropriateForKids) {
        product.appropriateForKids = appropriateForKids;
      }

      product.brandId = brandId || undefined;
      product.colorId = colorId || undefined;
      product.genderId = genderId || undefined;
      product.sizeId = sizeId || undefined;
      product.condition = condition || undefined;
      product.priceRange = priceRange || undefined;
      product.productTypeId = productTypeId || undefined;
      product.productMakeId = productMakeId || undefined;
      product.productModelId = productModelId || undefined;
      product.subTypeId = subTypeId || undefined;
      product.showYear = showYear || undefined;
      product.vehicleYear = vehicleYear || undefined;
      product.year = year || undefined;

      if (tags !== undefined && tags !== product.tags) {
        const { tags: tagsString, tagIds: tagsArray } = await handleTags({
          oldTags: product.tags,
          newTags: tags,
        });

        product.tags = tagsString;
        product.hashtags = tagsArray;
      }

      if (
        visibility &&
        (visibility !== product.visibility ||
          tribeIds !== product.tribeIds ||
          communityIds !== product.communityIds)
      ) {
        if (Const.productVisibilities.indexOf(visibility) === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeWrongVisibilityParameter,
            message: `EditProductControllerV2, wrong visibility parameter`,
          });
        }
        product.visibility = visibility;

        if (visibility === Const.productVisibilityTribes) {
          if (!tribeIds || tribeIds === "") {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeNoTribeIds,
              message: `EditProductControllerV2, no tribeIds parameter`,
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
              message: `EditProductControllerV2, ${message}`,
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
              message: `EditProductControllerV2, no communityIds parameter`,
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
              message: `EditProductControllerV2, ${message}`,
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
            message: `EditProductControllerV2, ${message}`,
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
        product.moderation.status !== Const.moderationStatusApprovalNeeded
      ) {
        product.moderation.status =
          user.merchantApplicationStatus === Const.merchantApplicationStatusApprovedWithPayout
            ? Const.moderationStatusApproved
            : Const.moderationStatusPending;
      }

      const allowEngagementBonus =
        fields.allowEngagementBonus == "1"
          ? true
          : fields.allowEngagementBonus == "0"
          ? false
          : undefined;
      if (allowEngagementBonus !== undefined) {
        if (!product.engagementBonus)
          product.engagementBonus = { allowed: allowEngagementBonus, allowEngagementBonus };
        else {
          product.engagementBonus.allowed = allowEngagementBonus;
          product.engagementBonus.allowEngagementBonus = allowEngagementBonus;
        }
      }

      const engagementBudgetCredits =
        fields.engagementBudgetCredits === undefined || isNaN(+fields.engagementBudgetCredits)
          ? undefined
          : +fields.engagementBudgetCredits;
      if (engagementBudgetCredits && engagementBudgetCredits > user.creditBalance) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCreditsEngagementBonusLargerThanCreditBalance,
          message: `EditProductControllerV2, engagement budget in credits larger than credits balance`,
        });
      }
      if (engagementBudgetCredits !== undefined) {
        if (!product.engagementBonus)
          product.engagementBonus = {
            budgetCredits: engagementBudgetCredits,
            engagementBudgetCredits,
          };
        else {
          product.engagementBonus.budgetCredits = engagementBudgetCredits;
          product.engagementBonus.engagementBudgetCredits = engagementBudgetCredits;
        }
      }

      const creditsPerLinkedExpo =
        fields.creditsPerLinkedExpo === undefined || isNaN(+fields.creditsPerLinkedExpo)
          ? undefined
          : +fields.creditsPerLinkedExpo;
      if (engagementBudgetCredits !== undefined) {
        if (!product.engagementBonus) product.engagementBonus = { creditsPerLinkedExpo };
        else product.engagementBonus.creditsPerLinkedExpo = creditsPerLinkedExpo;
      }
      if (fields.language && fields.language !== product.language) {
        product.language = isLanguageValid(fields.language || request.user.deviceLanguage)
          ? fields.language || request.user.deviceLanguage
          : "en";
      }

      product.modified = Utils.now();
      await product.save();

      try {
        await recombee.upsertProduct({ product: product.toObject() });
      } catch (error) {
        logger.error("EditProductControllerV2, recombee", error);
      }

      let productObj = product.toObject();
      productObj.owner = await User.findOne({
        _id: product.ownerId,
      })
        .select(Const.userSelectQuery)
        .exec();
      productObj.category = await Category.findOne({
        _id: productObj.categoryId,
      }).exec();
      productObj.owner = productObj.owner.toObject();
      if (!productObj.owner?.avatar) {
        productObj.owner.avatar = {};
      }

      productObj.category = category;
      if (category.parentId !== "-1") {
        productObj.parentCategory = parentCategory;
      }

      if (Object.keys(files).length > 0) {
        processMedia({
          productId: productObj._id.toString(),
          product: productObj,
          files,
        });
      }

      Base.successResponse(response, Const.responsecodeSucceed, productObj);
    } catch (e) {
      Base.errorResponse(response, Const.httpCodeServerError, "EditProductControllerV2", e);
      return;
    }
  },
);

function createProdParams(product) {
  const { name: productName, description: productDescription, location: locationObject } = product;
  const originalPrice = product.originalPrice.value;
  const originalMinPrice = product.originalPrice.minValue;
  const originalMaxPrice = product.originalPrice.maxValue;
  const location =
    locationObject.coordinates[0].toString() + "," + locationObject.coordinates[1].toString();

  const renamedKeys = {
    productName,
    productDescription,
    originalPrice,
    originalMinPrice,
    originalMaxPrice,
    location,
  };
  const prodParamsTemp = {
    isNegotiable: product.isNegotiable,
    itemCount: product.itemCount,
    condition: product.condition,
  };
  const prodParams = Object.assign(renamedKeys, prodParamsTemp);
  return prodParams;
}

function checkVisibility({ reqBody, product }) {
  const { productId, visibility, tribeIds, publish, ...otherParams } = reqBody;
  const prodParams = createProdParams(product);
  if (!otherParams || Object.keys(otherParams).length === 0) {
    return true;
  } else if (reqBody.visibility !== product.visibility) {
    let count = true;
    if (reqBody.tags && reqBody.tags !== product.tags) {
      return false;
    }
    Object.keys(prodParams).forEach((key) => {
      if (otherParams[key] && prodParams[key] !== otherParams[key]) {
        count = false;
      }
    });
    return count;
  } else {
    return false;
  }
}

async function processMedia({ productId, product, files }) {
  try {
    await Product.findByIdAndUpdate(productId, {
      mediaProcessingInfo: { status: "processing" },
    });

    let order = product.file.length - 1;
    let fileType = null;
    let convertToHslSuccess = false;

    for (let file in files) {
      const tempPath = files[file].path;
      const fileName = files[file].name;
      let fileMimeType = files[file].type;

      const destPath = Config.uploadPath + "/";
      const newFileName = Utils.getRandomString(32);
      const thumbFileName = Utils.getRandomString(32);
      const hslName = Utils.getRandomString(32);

      let width = null;
      let height = null;
      let aspectRatio = null;
      let thumbMimeType = null;
      let duration = null;
      let fileSize = null;
      let thumbSize = null;
      order++;

      if (fileMimeType.indexOf("video") > -1) {
        const inputMetadata = await mediaHandler.getMediaInfo(tempPath);
        width = inputMetadata.width;
        height = inputMetadata.height;
        //rotate video if necessary
        let dur = inputMetadata.duration;

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
        let rotation = originalVideoMetadata.rotation;
        if (rotation) {
          await Utils.rotateVideo(
            destPath + newFileName + "_compressed.mp4",
            destPath + newFileName + ".mp4",
            rotation,
          );
        } else {
          await fsp.copyFile(
            destPath + newFileName + "_compressed.mp4",
            destPath + newFileName + ".mp4",
          );
        }

        //get video dimensions
        const dimensions = await mediaHandler.getMediaInfo(destPath + newFileName + ".mp4");
        width = dimensions.width;
        height = dimensions.height;

        aspectRatio = Utils.roundNumber(width / height, 5);

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

        let thumb = await Utils.getVideoScreenshots(destPath, thumbFileName, newFileName);
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
          thumbFileName,
        );
        aspectRatio = thumb.originalRatio;
        thumbSize = thumb.image.size;
        thumbMimeType = "image/jpeg";
      }

      const newFile = {
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
      };

      await Product.findByIdAndUpdate(productId, { $push: { file: newFile } });
    }

    await Product.findByIdAndUpdate(productId, {
      mediaProcessingInfo: { status: "completed" },
    });
  } catch (error) {
    logger.error(
      `EditProductControllerV2, product ${productId} media processing error: ${error.message}`,
    );

    await Product.findByIdAndUpdate(productId, {
      mediaProcessingInfo: { status: "failed", error: error.message },
    });

    return;
  }
}

module.exports = router;
