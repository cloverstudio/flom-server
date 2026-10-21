"use strict";

const { Const } = require("#config");
const Utils = require("#utils");
const { Product, FlomFile } = require("#models");

async function validateData({ requestUserId, title, contentType, requestContentId, voiceNoteId }) {
  if (!title || title == "") {
    return {
      code: Const.responsecodeNoTitle,
      message: `no title parameter`,
    };
  }

  let voiceNote;
  if (voiceNoteId) {
    if (!Utils.isValidObjectId(voiceNoteId)) {
      return {
        code: Const.responsecodeInvalidVoiceNoteId,
        message: `voiceNoteId is not valid`,
      };
    }

    voiceNote = await FlomFile.findById(voiceNoteId).lean();

    if (!voiceNote) {
      return {
        code: Const.responsecodeFileNotFound,
        message: `voiceNoteId is not valid`,
      };
    }

    voiceNote = {
      _id: voiceNote._id.toString(),
      name: voiceNote.name,
      created: voiceNote.created,
      duration: voiceNote.duration,
      mimeType: voiceNote.mimeType,
      size: voiceNote.size,
    };
  }

  if (!contentType) {
    return {
      code: Const.responsecodeNoContentType,
      message: `no contentType parameter`,
    };
  }

  if (Const.marketingNotificationsContentTypes.indexOf(contentType) === -1) {
    return {
      code: Const.responsecodeWrongContentType,
      message: `wrong contentType parameter`,
    };
  }

  let contentId, contentName;
  if (
    Const.productTypes.indexOf(contentType) !== -1 ||
    contentType == Const.marketingNotificationsContentTypeService
  ) {
    if (contentType == Const.marketingNotificationsContentTypeService) {
      contentType = Const.productTypeService;
    }

    if (!requestContentId) {
      return {
        code: Const.responsecodeNoContentId,
        message: `no contentId parameter`,
      };
    }
    if (!Utils.isValidObjectId(requestContentId)) {
      return {
        code: Const.responsecodeInvalidObjectId,
        message: `contentId is not valid`,
      };
    }

    const product = await Product.findOne(
      {
        _id: requestContentId,
        type: contentType,
        ownerId: requestUserId,
        "moderation.status": Const.moderationStatusApproved,
      },
      { _id: 1, name: 1 },
    ).lean();

    if (!product) {
      return {
        code: Const.responsecodeProductNotFound,
        message: `product not found`,
      };
    }
    contentId = product._id.toString();
    contentName = product.name;
  } else if (contentType === Const.marketingNotificationsContentTypeProfile) {
    contentId = requestUserId;
  } else if (contentType === Const.marketingNotificationsContentTypeMarketplace) {
    contentId = requestUserId;
  }

  return { contentId, contentName, voiceNote };
}

module.exports = validateData;
