"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Category, Product, FlomMessage, ApiAccessLog } = require("#models");
const Logics = require("#logics");
const { recombee } = require("#services");
const sharp = require("sharp");
const {
  handleVideoFile,
  handleImageFile,
  handleAudioFile,
  deleteFile,
} = require("../../Product/helpers/handleFiles");
const easyimg = require("easyimage");
const fsp = require("fs/promises");

/**
 * @api {post} /api/v2/user/update Flom v1 Update Profile
 * @apiVersion 2.0.9
 * @apiName Flom v1 Update Profile
 * @apiGroup WebAPI User
 * @apiDescription Update profile of the request user
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {string} [name]                Name to display
 * @apiParam {string} [description]         Description
 * @apiParam {String} [location]            location - string "longitude,latitude"
 * @apiParam {String} [locationVisibility]  visibility of user location
 * @apiParam {String} [pushToken]           pushToken
 * @apiParam {String} [aboutBusiness]       aboutBusiness (Limited for creators, sellers and accType: "1")
 * @apiParam {String} [categoryId]          categoryId (Limited for creators, sellers and accType: "1")
 * @apiParam {String} [startsWorkingHour]   startsWorkingHour (Limited for creators, sellers and accType: "1")
 * @apiParam {String} [endsWorkingHour]     endsWorkingHour (Limited for creators, sellers and accType: "1")
 * @apiParam {String} [merchantDOB]         merchantDOB (Limited for accType: "1")
 * @apiParam {String} [merchantCode]        Merchant code which to put as selected in list of bank accounts (Limited for creators, sellers and accType: "1")
 * @apiParam {String} [userName]            userName (at least 3 characters)
 * @apiParam {String} [email]               Users email. Send empty string to delete email
 * @apiParam {String} [socialMedia]         JSON stringified array of objects e.g. "[{"type":1,"username":"md"},{"type":2,"username":"instar"}]"
 * @apiParam {file}   [file]                avatar file
 * @apiParam {file}   [coverAudio]          Users cover audio (mp3 or wav) (Limited for creators, sellers and accType: "1")
 * @apiParam {String} [deleteCoverAudio]    Used to delete cover audio, send "1" to delete coverAudio
 * @apiParam {file}   [coverBanner]         Users cover picture/banner
 * @apiParam {String} [deleteCoverBanner]   Used to delete cover banner, send "1" to delete coverBanner
 * @apiParam {file}   [coverVideo]          Users cover video (Limited for creators, sellers and accType: "1")
 * @apiParam {String} [deleteCoverVideo]    Used to delete cover video, send "1" to delete coverVideo
 * @apiParam {Number} [dateOfBirth]         Date of user's birth as the number of milliseconds since Jan 1 1970
 * @apiParam {Number} [enableKidsMode]      0 to disable, any other number to enable
 * @apiParam {String} [lightningUserName]   Lightning username
 * @apiParam {String} [stateCode]           Only necessary for USA and Canada
 * @apiParam {String} [zipCode]             Only necessary for USA
 * @apiParam {String} [bonusPaymentMethod]  Payment method for bonuses sent to user ("credits" or "sats")
 * @apiParam {String} [mentionSlug]         Mention slug for the user
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631281610656,
 *   "data": {
 *     "user": {
 *       "token": [{
 *         "token": "*****",
 *         "generateAt": 1631025885009
 *       }],
 *       "pushToken": [
 *         "new push token2"
 *       ],
 *       "webPushSubscription": [],
 *       "voipPushToken": [],
 *       "groups": [
 *         "5caf311bec0abb18999bd755"
 *       ],
 *       "muted": [],
 *       "blocked": [],
 *       "devices": [],
 *       "UUID": [{
 *         "UUID": "newUUID2",
 *         "deviceName": "Marko phone2",
 *         "lastLogin": 1631025885009,
 *         "blocked": null,
 *         "lastToken": {
 *           "token": "*****",
 *           "generateAt": 1631025885009
 *         },
 *         "pushTokens": [
 *           "new push token2"
 *         ]
 *       }],
 *       "bankAccounts": [],
 *       "location": {
 *         "type": "Point",
 *         "coordinates": [
 *           0,
 *           0
 *         ]
 *       },
 *       "locationVisibility": true,
 *       "isAppUser": true,
 *       "flomSupportAgentId": null,
 *       "newUserNotificationSent": false,
 *       "followedBusinesses": [],
 *       "likedProducts": [],
 *       "recentlyViewedProducts": [],
 *       "createdBusinessInFlom": false,
 *       "onAnotherDevice": false,
 *       "shadow": false,
 *       "featuredProductTypes": [],
 *       "blockedProducts": 0,
 *       "memberships": [],
 *       "socialMedia": [
 *         {
 *           "type": 5,
 *           "username": "gidra",
 *           "profileWebUrl": "https://www.youtube.com/user/gidra",
 *           "profileIOSUrl": "youtube://www.youtube.com/user/gidra",
 *           "profileAndroidUrl": "youtube://www.youtube.com/user/gidra"
 *         },
 *         {
 *           "type": 8,
 *           "username": "SnapKing",
 *           "profileWebUrl": "https://www.snapchat.com/add/SnapKing"
 *         }
 *       ],
 *       "isCreator": true,
 *       "isSeller": false,
 *       "_id": "61377add1f60bd126f66ca36",
 *       "giveInvitePromotion": false,
 *       "name": "Flom 11",
 *       "organizationId": "5caf3119ec0abb18999bd753",
 *       "status": 1,
 *       "created": 1631025885007,
 *       "phoneNumber": "+2348020000011",
 *       "userName": "61377add1f60bd126f66ca36",
 *       "email": "me@me.com",
 *       "lightningUserName": "blabla",
 *       "stateCode": "CA",
 *       "zipCode": "1405678",
 *       "cover": {
 *         "banner": {
 *           "file": {
 *             "originalName": "d7dr7gf-1352ef4c-412d-4b4f-88a3-a4b48c54c752.jpg",
 *             "nameOnServer": "iRnDRd7cz1sQf7ay8pSy7oK5CsE6lmBC",
 *             "size": 2384387,
 *             "mimeType": "image/png",
 *             "aspectRatio": 1.77779
 *           },
 *           "fileType": 0,
 *           "thumb": {
 *             "originalName": "dd4rk4f-1352ef4c-412d-4b4f-88a3-a4b48c54c752.jpg",
 *             "nameOnServer": "ZiBI6b1AUij3J5qUwLRlX4EOw7qyUyv5",
 *             "mimeType": "image/jpeg",
 *             "size": 168504
 *           }
 *         },
 *         "video": {
 *           "file": {
 *             "originalName": "MOV_0163.mp4",
 *             "nameOnServer": "KSV0L0XktDP7I1iQqRSs228jA5Jhq7of",
 *             "aspectRatio": 0.56251,
 *             "duration": 7.20721,
 *             "mimeType": "video/mp4",
 *             "size": 15931106,
 *             "hslName": "cZeu7cLE3EmdPARl0Ec7x7Oy7vLzExNs"
 *           },
 *           "fileType": 1,
 *           "thumb": {
 *             "originalName": "MOV_0163.mp4",
 *             "nameOnServer": "hmlYP0Gk4TTBbOcM4q97Dg7niwHTsO6f",
 *             "mimeType": "image/png",
 *             "size": 104732
 *           }
 *         },
 *         "audio": {
 *           "file": {
 *             "originalName": "Fullmetal Alchemist Brotherhood ED3.mp3",
 *             "nameOnServer": "mbaOe77gtEfNlB3G7yi12OKs7iFQpWhZ.mp3",
 *             "mimeType": "audio/mpeg",
 *             "duration": 276.088173,
 *             "size": 6626879
 *           },
 *           "fileType": 2
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
 * }
 *
 * @apiError (Errors) 400260 No merchant code
 * @apiError (Errors) 430530 Username not available
 * @apiError (Errors) 430531 Username too short (3 chars minimum)
 * @apiError (Errors) 430535 Invalid character in username
 * @apiError (Errors) 400580 Location wrong format
 * @apiError (Errors) 400680 Category not found
 * @apiError (Errors) 443824 Invalid state code (Canadian user)
 * @apiError (Errors) 443825 Invalid state code or zip code (American user)
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    var user = request.user;

    const UUID = request.headers["uuid"];
    const { fields, files } = await Utils.formParse(request);

    logger.info(
      `UpdateProfileController: \nuser: ${user.phoneNumber} \nrequest: ${JSON.stringify(fields)}`,
    );

    var {
      location,
      description,
      pushToken,
      aboutBusiness,
      categoryId: categoryBusinessId,
      startsWorkingHour,
      endsWorkingHour,
      merchantDOB,
      merchantCode,
      email,
      deleteCoverAudio,
      deleteCoverBanner,
      deleteCoverVideo,
      locationVisibility,
      dateOfBirth,
      enableKidsMode,
      lightningUserName,
      stateCode,
      zipCode,
      bonusPaymentMethod,
      mentionSlug,
    } = fields;

    //verify isCreator and isSeller fields
    const userId = user._id.toString();
    if (!user.isCreator) {
      const userContentCount = await Product.countDocuments({
        ownerId: userId,
        type: Const.productTypeVideo,
        isDeleted: false,
      });

      if (userContentCount > 0) {
        user.isCreator = true;
      } else if (user.isCreator === undefined) {
        user.isCreator = false;
      }
    }

    if (!user.isSeller) {
      const userProductsCount = await Product.countDocuments({
        ownerId: userId,
        type: Const.productTypeProduct,
        isDeleted: false,
      });

      if (userProductsCount > 0) {
        user.isSeller = true;
      }
    } else if (user.isSeller === undefined) {
      user.isSeller = false;
    }

    if (description !== undefined && description !== user.description) {
      user.description = description;
    }
    if (email && user.email !== email) {
      user.email = email;
    } else if (email === "") {
      delete user.email;
    }
    if (fields.socialMedia) {
      const socialMedia = JSON.parse(fields.socialMedia);
      if (user.socialMedia !== socialMedia) {
        user.socialMedia = socialMedia;
      }
    }
    if (aboutBusiness !== undefined && aboutBusiness !== user.aboutBusiness) {
      user.aboutBusiness = aboutBusiness;
    }

    if (dateOfBirth !== undefined && dateOfBirth !== null) {
      user.dateOfBirth = dateOfBirth;

      const FatAiUser = await User.findOne({ _id: Const.FatAiObjectId }).lean();
      const chatIdFatAiIncluded = Utils.chatIdByUser(FatAiUser, user);
      const oldMessagesFatAi = await FlomMessage.find({ roomID: chatIdFatAiIncluded });

      if (
        (!oldMessagesFatAi || !oldMessagesFatAi.length) &&
        (Date.now() - user.dateOfBirth) / Const.milisInYear >= 16
      ) {
        const messageParamsFatAi = {
          roomID: chatIdFatAiIncluded,
          userID: FatAiUser._id.toString(),
          type: Const.messageTypeText,
          message: Const.welcomeMessageChatGpt,
          plainTextMessage: true,
          isRecursiveCall: true, //this will prevent call to chatgpt api
        };

        await Logics.sendMessage(messageParamsFatAi);
      }
    }

    if (enableKidsMode !== undefined) {
      user.kidsMode = +enableKidsMode === 0 ? false : true;
    }

    if (user.isCreator || user.isSeller || user.typeAcc === 1) {
      if (merchantCode) {
        let merchantCodeFound = false;

        const bankAccounts = user.bankAccounts.map((bankAccount) => {
          if (bankAccount.merchantCode === merchantCode) {
            merchantCodeFound = true;
            bankAccount.selected = true;
          } else {
            bankAccount.selected = false;
          }
          return bankAccount;
        });

        if (!merchantCodeFound) {
          logger.error("UpdateProfileController, responsecodeNoMerchantCode");
          return Base.successResponse(response, Const.responsecodeNoMerchantCode);
        }

        user.bankAccounts = bankAccounts;
      }
    }

    if (user.isSeller || user.typeAcc === 1) {
      if (startsWorkingHour && endsWorkingHour) {
        user.workingHours = { start: startsWorkingHour, end: endsWorkingHour };
      }

      if (
        categoryBusinessId &&
        categoryBusinessId !== "undefined" &&
        categoryBusinessId !== "null"
      ) {
        let category;
        try {
          category = await Category.findOne({ _id: categoryBusinessId }).lean();
        } catch (error) {
          logger.error("UpdateProfileController, responsecodeCategoryNotFound");
          return Base.successResponse(response, Const.responsecodeCategoryNotFound);
        }

        if (!category) {
          logger.error("UpdateProfileController, responsecodeCategoryNotFound");
          return Base.successResponse(response, Const.responsecodeCategoryNotFound);
        }

        user.categoryBusinessId = categoryBusinessId;
        user.businessCategory = {
          _id: category._id,
          name: category.name,
        };
      }
    }

    if (user.typeAcc === 1) {
      if (merchantDOB) {
        user.merchantDOB = merchantDOB;
      }
    }

    if (location) {
      const coordinates = location.split(",").map((c) => Number(c));

      if (coordinates.length !== 2) {
        logger.error("UpdateProfileController, responsecodeMerchantLocationWrongFormat");
        return Base.successResponse(response, Const.responsecodeMerchantLocationWrongFormat);
      }

      user.location = {
        type: "Point",
        coordinates: coordinates,
      };

      if (user.typeAcc === 1) {
        const ownerId = userId;
        const newLocation = user.location;
        Product.updateMany({ ownerId, isDeleted: false }, { location: newLocation });
      }

      await ApiAccessLog.create({
        type: "LocationIQ",
        api: "UpdateProfileController",
        userName: user.userName,
        createdDate: new Date(),
      });

      try {
        const address = await Utils.getAddressFromCoordinates({
          lat: coordinates[1],
          lon: coordinates[0],
        });

        user.address = address;
      } catch (error) {
        logger.error("UpdateProfileController, address", error);
      }
    }

    if (locationVisibility) {
      locationVisibility = locationVisibility === "true";
      user.locationVisibility = locationVisibility;
    }

    const userName = fields.userName || fields.name;

    if (userName && user.userName !== userName) {
      if (userName.length < 3) {
        logger.error("UpdateProfileController, responsecodeUsernameTooShort");
        return Base.successResponse(response, Const.responsecodeUsernameTooShort);
      }

      const regexTerminalCode = /[^0-9]/g;
      if (
        !userName.match(regexTerminalCode) ||
        userName.startsWith("Flomer_") ||
        userName.startsWith("flomer_") ||
        userName.startsWith("Deleted_") ||
        userName.startsWith("deleted_")
      ) {
        logger.error("UpdateProfileController, responsecodeUsernameInvalidCharsUsed");
        return Base.successResponse(response, Const.responsecodeUsernameInvalidCharsUsed);
      }

      const userNameRegex = new RegExp(`^${userName}$`, "i");
      const result = await User.findOne({
        $or: [{ userName: userNameRegex }, { lightningUserName: userNameRegex }],
      }).lean();

      if (result) {
        logger.error("UpdateProfileController, responsecodeUsernameNotAvailable");
        return Base.successResponse(response, Const.responsecodeUsernameNotAvailable);
      } else {
        const regex = RegExp("([a-zA-Z0-9]|-|_|~)");
        const invalidChars = [];

        userName.split("").map((c) => {
          if (!regex.test(c)) {
            invalidChars.push(c);
          }
        });

        if (invalidChars.length > 0) {
          logger.error("UpdateProfileController, responsecodeUsernameInvalidCharsUsed");
          return Base.successResponse(response, Const.responsecodeUsernameInvalidCharsUsed);
        }

        user.userName = userName;
        user.name = userName;
      }
    }

    if (lightningUserName && user.lightningUserName !== lightningUserName) {
      lightningUserName = lightningUserName.toLowerCase();

      if (user.hasChangedLnUserName) {
        logger.error("UpdateProfileController, responsecodeLnUserNameAlreadyChangedOnce");
        return Base.successResponse(response, Const.responsecodeLnUserNameAlreadyChangedOnce);
      }

      if (lightningUserName.length > 12) {
        logger.error("UpdateProfileController, responsecodeLnUserNameTooLong");
        return Base.successResponse(response, Const.responsecodeLnUserNameTooLong);
      }

      const regexTerminalCode = /[^0-9]/g;
      if (!lightningUserName.match(regexTerminalCode)) {
        logger.error("UpdateProfileController, responsecodeInvalidLnUserName");
        return Base.successResponse(response, Const.responsecodeInvalidLnUserName);
      }
      if (/[^a-z0-9\-_+.]/g.test(lightningUserName)) {
        logger.error("UpdateProfileController, responsecodeInvalidLnUserName");
        return Base.successResponse(response, Const.responsecodeInvalidLnUserName);
      }

      const lnRegex = new RegExp(`^${lightningUserName}$`, "i");

      const result = await User.findOne({
        $or: [{ lightningUserName: lnRegex }, { userName: lnRegex }],
      }).lean();
      if (result) {
        logger.error("UpdateProfileController, responsecodeLnUserNameNotAvailable");
        return Base.successResponse(response, Const.responsecodeLnUserNameNotAvailable);
      }

      const baseUrl = Config.environment === "production" ? "flom.app" : "flom.dev";
      const lnurl = `https://${baseUrl}/.well-known/lnurlp/${lightningUserName}`;
      const lightningUrlEncoded = Utils.encodeLnUrl(lnurl);

      user.lightningUserName = lightningUserName;
      user.lightningUrlEncoded = lightningUrlEncoded;
      user.hasChangedLnUserName = true;
      /*
          if (user.lightningInfo) {
            let index = null;
            for (let i = 0; i < user.lightningInfo.length; i++) {
              const item = user.lightningInfo[i];
              if (!item.userName.match(/[^0-9]/g)) {
                index = i;
              }
            }

            if (index !== null) {
              user.lightningInfo = user.lightningInfo.splice(index, 1);
            }

            user.lightningInfo.push({
              userName: lightningUserName,
              address: lightningAddress,
              encodedUrl: lightningUrlEncoded,
            });
          }
          */
    }

    const countryCode =
      user.countryCode || Utils.getCountryCodeFromPhoneNumber({ phoneNumber: user.phoneNumber });

    const options = {
      method: "GET",
      url: Config.taxApiUrlCanada,
      headers: { apikey: Config.taxApiKey },
    };

    let res;
    if (countryCode === "CA" && stateCode && !zipCode) {
      options.url = Config.taxApiUrlCanada;

      try {
        res = await Utils.sendRequest(options);
      } catch (error) {
        logger.error("UpdateProfileController, responsecodeInvalidStateCode");
        return Base.successResponse(response, Const.responsecodeInvalidStateCode);
      }

      let hasStateCode = false;
      res.forEach((rate) => {
        if (rate.state === stateCode) hasStateCode = true;
      });

      if (!hasStateCode) {
        logger.error("UpdateProfileController, responsecodeInvalidStateCode");
        return Base.successResponse(response, Const.responsecodeInvalidStateCode);
      }

      user.stateCode = stateCode;
    }
    if (countryCode == "US" && stateCode && zipCode) {
      options.url = Config.taxApiUrlUsa
        .replace("ZIP_CODE", zipCode)
        .replace("STATE_CODE", stateCode);

      try {
        res = await Utils.sendRequest(options);
      } catch (error) {
        logger.error("UpdateProfileController, responsecodeInvalidStateCodeOrZipCode");
        return Base.successResponse(response, Const.responsecodeInvalidStateCodeOrZipCode);
      }

      if (res.combined_use_rate === 0) {
        logger.error("UpdateProfileController, responsecodeInvalidStateCodeOrZipCode");
        return Base.successResponse(response, Const.responsecodeInvalidStateCodeOrZipCode);
      }

      user.stateCode = stateCode;
      user.zipCode = zipCode;
    }

    if (user.cover === undefined) {
      user.cover = {};
    }

    if ((deleteCoverBanner === "1" || files.coverBanner !== undefined) && user.cover.banner) {
      if (user.cover.banner.file.nameOnServer !== "defaultBanner") {
        await deleteFile(user.cover.banner);
      }
      user.cover.banner = Const.defaultProfileBanner;
    }

    if ((deleteCoverAudio === "1" || files.coverAudio !== undefined) && user.cover.audio) {
      await deleteFile(user.cover.audio);
      delete user.cover.audio;
    }

    if ((deleteCoverVideo === "1" || files.coverVideo !== undefined) && user.cover.video) {
      await deleteFile(user.cover.video);
      delete user.cover.video;
    }

    if (bonusPaymentMethod && user.bonusPaymentMethod !== bonusPaymentMethod) {
      user.bonusPaymentMethod = bonusPaymentMethod;
    }

    const fileKeys = Object.keys(files);
    for (let i = 0; i < fileKeys.length; i++) {
      const file = files[fileKeys[i]];
      const fileMimeType = file.type;

      switch (fileKeys[i]) {
        case "coverBanner":
          if (fileMimeType.indexOf("image") !== -1) {
            user.cover.banner = await handleImageFile(file);
          } else {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeFileTypeNotSupported,
              message: `UpdateProfileController, image, invalid file with mime type: ${fileMimeType}`,
            });
          }
          break;
        case "coverAudio":
          if (fileMimeType.indexOf("audio") !== -1) {
            if (
              files.coverAudio.type === "audio/mpeg" ||
              files.coverAudio.type === "audio/wav" ||
              files.coverAudio.type === "audio/x-wav" ||
              files.coverAudio.type === "audio/aac" ||
              files.coverAudio.type === "audio/x-aac"
            ) {
              user.cover.audio = await handleAudioFile(file);
            }
          } else {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeFileTypeNotSupported,
              message: `UpdateProfileController, audio, invalid file with mime type: ${fileMimeType}`,
            });
          }
          break;
        case "coverVideo":
          if (fileMimeType.indexOf("video") !== -1) {
            user.cover.video = await handleVideoFile(file);
          } else {
            return Base.newErrorResponse({
              response,
              code: Const.responsecodeFileTypeNotSupported,
              message: `UpdateProfileController, video, invalid file with mime type: ${fileMimeType}`,
            });
          }
          break;
      }
    }

    if (files.file) {
      if (user.avatar && user.avatar.nameOnServer) {
        await fsp.unlink(Config.uploadPath + "/" + user.avatar.nameOnServer);
      }
      if (user.thumbnail && user.thumbnail.nameOnServer) {
        await fsp.unlink(Config.uploadPath + "/" + user.thumbnail.nameOnServer);
      }

      let file = files.file;
      const tempPath = file.path;
      const fileName = file.name;
      const destPath = Config.uploadPath + "/";
      file.newFileName = Utils.getRandomString(32);

      await sharp(tempPath)
        .png()
        .toFile(destPath + file.newFileName);

      // generate thumbnail
      if (
        file.type.indexOf("jpeg") > -1 ||
        file.type.indexOf("gif") > -1 ||
        file.type.indexOf("png") > -1
      ) {
        file.thumbName = Utils.getRandomString(32);
        const destPathTmp = Config.uploadPath + "/" + file.thumbName;
        let newThumbFile = await easyimg.thumbnail({
          src: Config.uploadPath + "/" + file.newFileName,
          dst: destPathTmp + ".png",
          width: Const.thumbSize,
          height: Const.thumbSize,
        });
        file.thumbSize = newThumbFile.size;

        await fsp.rename(destPathTmp + ".png", destPathTmp);
      } else {
        Base.errorResponse(response, "thumb creation failed");
      }

      user.avatar = {
        picture: {
          originalName: fileName,
          size: file.size,
          mimeType: "image/png",
          nameOnServer: file.newFileName,
        },
        thumbnail: {
          originalName: fileName,
          size: file.thumbSize,
          mimeType: "image/png",
          nameOnServer: file.thumbName,
        },
      };

      let size = 0;
      if (user.avatar.picture.size) {
        const originalSize = user.avatar.picture.size + user.avatar.thumbnail.size;
        const newSize = file.size + file.thumbSize;
        size = newSize - originalSize;
      } else {
        size = file.size + file.thumbSize;
      }

      // update organization disk usage
      await Logics.updateOrganizationDiskUsage(user.organizationId, size);
    }

    if (pushToken) {
      const updatePushToken = (newPushToken, { pushToken: savedPushTokens } = {}) => {
        if (!savedPushTokens || !Array.isArray(savedPushTokens)) {
          savedPushTokens = [];
        }

        if (savedPushTokens.indexOf(newPushToken) == -1) {
          savedPushTokens.push(newPushToken);
        }
        return savedPushTokens;
      };

      const updateUUID = (currentUUID, savedUUIDs, newPushToken) => {
        if (!currentUUID) {
          return savedUUIDs;
        }

        return savedUUIDs.map((uuid) => {
          if (uuid.UUID === currentUUID) {
            const savedPushTokens = uuid.pushTokens ? uuid.pushTokens : [];
            if (savedPushTokens.indexOf(newPushToken) === -1) {
              savedPushTokens.push(newPushToken);
              uuid.pushTokens = savedPushTokens;
            }
          }
          return uuid;
        });
      };

      user.pushToken = updatePushToken(pushToken, user);
      user.UUID = updateUUID(UUID, user.UUID, pushToken);
    }

    if (mentionSlug && user.mentionSlug !== mentionSlug) {
      if (user.whatsApp?.mentionSlugChanged) {
        return Base.successResponse(response, Const.responsecodeMentionSlugAlreadyChanged);
      }

      if (
        await User.exists({
          $or: [
            { "whatsApp.mentionSlug": mentionSlug },
            { "whatsApp.oldMentionSlug": mentionSlug },
          ],
        })
      ) {
        logger.error("UpdateProfileController, responsecodeMentionSlugNotAvailable");
        return Base.successResponse(response, Const.responsecodeMentionSlugNotAvailable);
      }

      if (!user.whatsApp) user.whatsApp = {};
      user.whatsApp.oldMentionSlug = user.whatsApp.mentionSlug;
      user.whatsApp.mentionSlug = mentionSlug;
      user.whatsApp.mentionSlugChanged = true;
      user.whatsApp.oldMentionSlugExpiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000; // expires in 90 days
    }

    user.modified = Date.now();
    await User.updateOne({ _id: user._id }, user);
    await recombee.upsertUser(user);

    user.socialMedia = Utils.generateSocialMediaWithLinks({ socialMedia: user.socialMedia });

    Base.successResponse(response, Const.responsecodeSucceed, { user });
  } catch (error) {
    Base.errorResponse(response, Const.httpCodeServerError, "UpdateProfileController", error);
  }
});

module.exports = router;
