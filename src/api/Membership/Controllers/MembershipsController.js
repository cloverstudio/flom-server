"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Membership, User } = require("#models");
const { formatImageData } = require("../helpers");
const fsp = require("fs/promises");

/**
 * @api {post} /api/v2/memberships Create new membership
 * @apiVersion 2.0.8
 * @apiName Create new membership
 * @apiGroup WebAPI Membership
 * @apiDescription Creates new membership. User needs to be a creator in order to be allowed to create memberships.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} name Plan name (title)
 * @apiParam {Number} amount Plan amount
 * @apiParam {String} description Description of the membership plan
 * @apiParam {Object[]} benefits Array of objects containing benefits for the plan. Each object should have type, title and enabled
 * (e.g. {"type": 1, "title": "Group chat", "enabled": true})
 * @apiParam {Number} order Order number used for sorting memberships
 * @apiParam {File} [image] Membership's image. File has to be image (jpeg, jpg, png...)
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631704703703,
 *   "data": {
 *     "membership": {
 *       "benefits": [
 *         {
 *           "type": 1,
 *           "title": "Group chat",
 *           "enabled": true
 *         },
 *         {
 *           "type": 2,
 *           "title": "Private messaging",
 *           "enabled": false
 *         },
 *         {
 *           "type": 3,
 *           "title": "Video call",
 *           "enabled": false
 *         },
 *         {
 *           "type": 4,
 *           "title": "Audio call",
 *           "enabled": false
 *         }
 *       ],
 *       "created": 1631704703656,
 *       "_id": "6141d67f58217d8cfc30ca7d",
 *       "name": "Plan 3",
 *       "image": {
 *            "originalName": "Screenshot from 2022-06-01 10-30-37.png",
 *            "size": 293410,
 *            "mimeType": "image/png",
 *            "nameOnServer": "upload_31afa465c412c060e495db6d7c857a7d",
 *            "link": "/home/vladimir/Documents/GitHub/Roja_Server/public/uploads/upload_31afa465c412c060e495db6d7c857a7d",
 *            "thumbnailName": "thumb_31afa465c412c060e495db6d7c857a7d"
 *       },
 *       "amount": 12.99,
 *       "description": "This is the greatest plan. Get it now!",
 *       "order": 3,
 *       "creatorId": "5f7ee464a283bc433d9d722f",
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
 * @apiError (Errors) 400270 No amount
 * @apiError (Errors) 443233 User is not a creator
 * @apiError (Errors) 443234 Maximum number of memberships per creator reached
 * @apiError (Errors) 443235 No name
 * @apiError (Errors) 443236 No description
 * @apiError (Errors) 443248 Bad image file
 * @apiError (Errors) 443237 No benefits
 * @apiError (Errors) 443238 Invalid benefits parameter
 * @apiError (Errors) 443239 Wrong order parameter (membership with that order parameter already exists)
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { _id: userId } = request.user;

    const data = await Utils.formParse(request);
    const image = data?.files?.image;

    console.log("data", data);

    if (!user.isCreator) {
      const userContentCount = await Product.countDocuments({
        ownerId: userId,
        type: Const.productTypeVideo,
      });

      if (userContentCount > 0) {
        user.isCreator = true;
      } else if (user.isCreator === undefined) {
        user.isCreator = false;
      }
      await User.findByIdAndUpdate(user._id.toString(), { isCreator: user.isCreator });
    }

    if (user.isCreator === false) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotCreator,
        message: `MembershipsController - create membership, user is not a creator`,
      });
    }

    const creatorMemberships = await Membership.find({
      creatorId: userId,
      deleted: false,
    }).lean();
    if (creatorMemberships.length >= Config.creatorMembershipsMaxCount) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMembershipsMaxCountReached,
        message: `MembershipsController - create membership, max membership count reached`,
      });
    }

    const { name, benefits, description } = data?.fields;
    const amount = +data?.fields.amount;
    const order = +data?.fields.order;

    if (!name || name === "") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoName,
        message: `MembershipsController - create membership, no name`,
      });
    }
    if (amount === 0 && !amount) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoAmount,
        message: `MembershipsController - create membership, no amount`,
      });
    }
    if (!description) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoDescription,
        message: `MembershipsController - create membership, no description`,
      });
    }
    if (!benefits || benefits === "") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoBenefits,
        message: `MembershipsController - create membership, no benefits`,
      });
    }

    const parsedBenefits = JSON.parse(benefits);

    const membershipBenefits = Const.membershipBenefits;
    for (let i = 0; i < parsedBenefits.length; i++) {
      const { type, enabled } = parsedBenefits[i];
      if (membershipBenefits[type] === undefined) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidBenefit,
          message: `MembershipsController - create membership, invalid benefits parameter`,
        });
      } else {
        membershipBenefits[type].enabled = enabled;
      }
    }

    if (creatorMemberships.find((membership) => membership.order === order) !== undefined) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeWrongOrderParameter,
        message: `MembershipsController - create membership, wrong order parameter`,
      });
    }

    if (image && image.type.split("/")[0] !== "image") {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMemebershipImageInvalid,
        message: `MembershipsController - bad image parameter`,
      });
    }

    const formattedImage = image ? formatImageData(image) : {};

    if (image) {
      await fsp.copyFile(image.path, `${Config.uploadPath}/${formattedImage.nameOnServer}`);
      formattedImage.thumbnailName = await Utils.generateThumbnailFromImage(
        formattedImage.nameOnServer,
      );
    }

    const membershipBenefitsArray = Object.values(membershipBenefits);
    const membership = await Membership.create({
      name,
      amount,
      description,
      benefits: membershipBenefitsArray,
      image: formattedImage,
      order,
      creatorId: userId,
    });

    const membershipObj = membership.toObject();
    delete membershipObj.__v;

    Base.successResponse(response, Const.responsecodeSucceed, {
      membership: membershipObj,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MembershipsController - create membership",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/memberships/:membershipId Update membership
 * @apiVersion 2.0.8
 * @apiName Update membership
 * @apiGroup WebAPI Membership
 * @apiDescription Updating membership information
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} [name] Plan name (title)
 * @apiParam {Number} [amount] Plan amount
 * @apiParam {String} [description] Description of the membership plan
 * @apiParam {Object[]} [benefits] Array of objects containing benefits for the plan. Each object should have type, title and enabled
 * (e.g. {"type": 1, "title": "Group chat", "enabled": true})
 * @apiParam {String} [deleteImage] String "1" for deleting image
 * @apiParam {File} [image] Membership's image. File has to be image (jpeg, jpg, png...)
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631704703703,
 *   "data": {
 *     "membership": {
 *       "benefits": [
 *         {
 *           "type": 1,
 *           "title": "Group chat",
 *           "enabled": true
 *         },
 *         {
 *           "type": 2,
 *           "title": "Private messaging",
 *           "enabled": false
 *         },
 *         {
 *           "type": 3,
 *           "title": "Video call",
 *           "enabled": false
 *         },
 *         {
 *           "type": 4,
 *           "title": "Audio call",
 *           "enabled": false
 *         }
 *       ],
 *       "created": 1631704703656,
 *       "_id": "6141d67f58217d8cfc30ca7d",
 *       "name": "Plan 3",
 *       "amount": 12.99,
 *       "description": "This is the greatest plan. Get it now!",
 *       "image": {
 *            "originalName": "Screenshot from 2022-06-01 10-30-37.png",
 *            "size": 293410,
 *            "mimeType": "image/png",
 *            "nameOnServer": "upload_31afa465c412c060e495db6d7c857a7d",
 *            "link": "/home/vladimir/Documents/GitHub/Roja_Server/public/uploads/upload_31afa465c412c060e495db6d7c857a7d",
 *            "thumbnailName": "thumb_31afa465c412c060e495db6d7c857a7d"
 *       },
 *       "order": 3,
 *       "creatorId": "5f7ee464a283bc433d9d722f",
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
 * @apiError (Errors) 443238 Invalid benefits parameter
 * @apiError (Errors) 443240 Invalid membershipId
 * @apiError (Errors) 443241 Membership with membershipId is not found
 * @apiError (Errors) 443248 Bad image file
 * @apiError (Errors) 443242 User not creator of the membership
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch("/:membershipId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { _id: userId } = request.user;
    const { membershipId } = request.params;

    if (!Utils.isValidObjectId(membershipId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidMembershipId,
        message: `MembershipsController - update membership, invalid membershipId`,
      });
    }

    const membership = await Membership.findOne({ _id: membershipId });
    if (!membership) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMembershipNotFound,
        message: `MembershipsController - update membership, membership with ${membershipId} not found`,
      });
    }

    if (membership.creatorId !== userId.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotMembershipCreator,
        message: `MembershipsController - update membership, user not the creator of the membership`,
      });
    }

    //const { name, benefits, description, deleteImage } = request.body;

    const data = await Utils.formParse(request);
    const { name, benefits, description, deleteImage } = data.fields;
    const amount = +data.fields.amount || null;
    const image = data?.files?.image;

    console.log("data", data);

    const imageDelete = deleteImage && _.isString(deleteImage) && deleteImage === "1";

    if (!imageDelete && image && image.type.split("/")[0] === "image") {
      membership.image = formatImageData(image);

      await fsp.copyFile(image.path, `${Config.uploadPath}/${membership.image.nameOnServer}`);
      membership.image.thumbnailName = await Utils.generateThumbnailFromImage(
        membership.image.nameOnServer,
      );
    }

    if (imageDelete) {
      membership.image = {};
    }

    if (name && name !== "") {
      membership.name = name;
    }
    if (amount && amount !== 0) {
      membership.amount = amount;
    }
    if (description) {
      membership.description = description;
    }
    if (benefits && benefits !== "") {
      const parsedBenefits = JSON.parse(benefits);
      const membershipBenefits = Const.membershipBenefits;
      for (let i = 0; i < parsedBenefits.length; i++) {
        const { type, enabled } = parsedBenefits[i];
        if (membershipBenefits[type] === undefined) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidBenefit,
            message: `MembershipsController - update membership, invalid benefits parameter`,
          });
        } else {
          membershipBenefits[type].enabled = enabled;
        }
      }
      membership.benefits = Object.values(membershipBenefits);
    }
    await membership.save();

    const membershipObj = membership.toObject();
    delete membershipObj.__v;

    Base.successResponse(response, Const.responsecodeSucceed, {
      membership: membershipObj,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MembershipsController - update membership",
      error,
    });
  }
});

/**
 * @api {delete} /api/v2/memberships/:membershipId Delete membership
 * @apiVersion 2.0.8
 * @apiName Delete membership
 * @apiGroup WebAPI Membership
 * @apiDescription API used for deleting a membership
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success-Response:
 * {
 *   "code": 1,
 *   "time": 1631704703703,
 *   "data": {
 *     "deleted": true,
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443240 Invalid membershipId
 * @apiError (Errors) 443241 Membership with membershipId is not found
 * @apiError (Errors) 443242 User not creator of the membership
 * @apiError (Errors) 4000007 Token not valid
 */

router.delete("/:membershipId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { _id: userId } = request.user;
    const { membershipId } = request.params;

    if (!Utils.isValidObjectId(membershipId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidMembershipId,
        message: `MembershipsController - delete membership, invalid membershipId`,
      });
    }

    const membership = await Membership.findOne({ _id: membershipId });
    if (!membership) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeMembershipNotFound,
        message: `MembershipsController - delete membership, membership with ${membershipId} not found`,
      });
    }

    if (membership.creatorId !== userId.toString()) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotMembershipCreator,
        message: `MembershipsController - delete membership, user not the creator of the membership`,
      });
    }

    membership.deleted = true;
    await membership.save();

    Base.successResponse(response, Const.responsecodeSucceed, {
      deleted: true,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MembershipsController - delete membership",
      error,
    });
  }
});

module.exports = router;
