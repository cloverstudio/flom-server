"use strict";

const { Const } = require("#config");
const { Transfer } = require("#models");

async function isUserAllowedToLeaveReview({
  userId = null,
  userMemberships = [],
  productId = null,
  ownerId = null,
  productType = null,
  allowPublicComments,
}) {
  if (!userId) {
    throw new Error("isUserAllowedToLeaveReview, missing userId");
  }
  if (!productId) {
    throw new Error("isUserAllowedToLeaveReview, missing productId");
  }
  if (!ownerId) {
    throw new Error("isUserAllowedToLeaveReview, missing ownerId");
  }
  if (!productType) {
    throw new Error("isUserAllowedToLeaveReview, missing productType");
  }

  if (!!allowPublicComments || userId === ownerId) {
    return true;
  }

  if (productType === Const.productTypeProduct) {
    const transfer = await Transfer.findOne({
      senderId: userId,
      status: Const.transferComplete,
      transferType: Const.transferTypeMarketplace,
      "basket.id": productId,
    }).lean();

    return !!transfer;
  } else {
    const transfer = await Transfer.findOne({
      senderId: userId,
      status: Const.transferComplete,
      transferType: Const.transferTypeSuperBless,
      productId,
    }).lean();

    const userIsMemberOfOwnersCommunity =
      userMemberships.findIndex((membership) => membership.creatorId === ownerId) > -1;

    return !!transfer || userIsMemberOfOwnersCommunity;
  }
}

module.exports = { isUserAllowedToLeaveReview };
