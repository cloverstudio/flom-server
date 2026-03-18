"use strict";

const { logger } = require("#infra");
const { Const } = require("#config");
const { Product, User } = require("#models");
const Logics = require("#logics");

async function sendApprovedProductBonuses({ product, owner }) {
  try {
    if (product.moderation.status !== Const.moderationStatusApproved) {
      return;
    }

    if (product.type === Const.productTypeProduct) {
      await Logics.sendBonus({
        userId: product.ownerId,
        userPhoneNumber: owner.phoneNumber,
        bonusType: Const.dataForFirstPaymentOrApprovedProduct,
        productId: product._id.toString(),
        productName: product.name,
        ownerId: product.ownerId,
      });
    } else {
      await Logics.sendBonus({
        userId: product.ownerId,
        bonusType: Const.bonusTypeContent,
        productId: product._id.toString(),
        productName: product.name,
        ownerId: product.ownerId,
      });
    }

    if (product.type === Const.productTypeVideoStory && product.linkedProductId) {
      const linkedProduct = await Product.findById(product.linkedProductId).lean();

      const {
        isDeleted,
        ownerId: linkedOwnerId,
        engagementBonus: {
          allowed = false,
          allowEngagementBonus = false,
          budgetCredits = 0,
          engagementBudgetCredits: engagementBudgetCreditsNew = 0,
          creditsPerLinkedExpo = 0,
        } = {},
      } = linkedProduct;

      const engagementBonusAllowed = allowed || allowEngagementBonus;
      const engagementBudgetCredits = budgetCredits || engagementBudgetCreditsNew;

      const linkedOwner = await User.findOne({
        _id: linkedOwnerId,
        "isDeleted.value": false,
      }).lean();

      if (
        linkedOwnerId !== product.ownerId &&
        !isDeleted &&
        engagementBonusAllowed &&
        engagementBudgetCredits > (linkedOwner?.creditBalance || 0) &&
        creditsPerLinkedExpo > 0
      ) {
        await Logics.sendBonus({
          userId: product.ownerId,
          bonusType: Const.creditsForLinkedProductInExpo,
          linkedProductId: product.linkedProductId,
        });
      }
    }
  } catch (error) {
    logger.error("Error in sendApprovedProductBonuses", error);
  }
}

module.exports = sendApprovedProductBonuses;
