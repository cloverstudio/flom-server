"use strict";

const { DateTime } = require("luxon");
const { logger } = require("#infra");
const { Const } = require("#config");
const { Product } = require("#models");

async function autoApproveProduct(req, res, next) {
  req.autoApproveProduct = true;

  try {
    if (!req.user) {
      req.autoApproveProduct = false;
      return next();
    }

    if (req.user.isAdmin) {
      req.autoApproveProduct = false;
      return next();
    }

    if (req.user.merchantApplicationStatus !== Const.merchantApplicationStatusApprovedWithPayout) {
      req.autoApproveProduct = false;
      return next();
    }

    const products = await Product.find({ ownerId: req.user._id.toString(), isDeleted: false })
      .sort({ created: 1 })
      .lean();

    let approvedContentCount = 0;
    let lastRejectedProduct = null;

    for (const product of products) {
      if (
        product.moderation.status === Const.moderationStatusRejected &&
        (!lastRejectedProduct ||
          !product.moderation.timestamp ||
          product.moderation.timestamp > lastRejectedProduct.moderation.timestamp)
      ) {
        lastRejectedProduct = product;
      }

      if (product.moderation.status === Const.moderationStatusApproved) {
        approvedContentCount++;
      }
    }

    if (approvedContentCount < 5) {
      req.autoApproveProduct = false;
      return next();
    }

    const base = DateTime.now();
    const limit = base.minus({ days: 30 }).startOf("day").toUTC().toMillis();

    if (lastRejectedProduct && lastRejectedProduct.moderation.timestamp > limit) {
      req.autoApproveProduct = false;
      return next();
    }
  } catch (error) {
    req.autoApproveProduct = false;
    logger.error("autoApproveProduct", error);
  }

  next();
}

module.exports = autoApproveProduct;
