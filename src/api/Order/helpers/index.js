"use strict";

const { logger } = require("#infra");
const { Transfer } = require("#models");
const { authorizeNet } = require("#services");

async function voidOrRefundTransfer({ transfer, action }) {
  try {
    let res = false,
      updateQuery = null;

    if (action === "refund") {
      res = await authorizeNet.refundTransaction(transfer);
      updateQuery = {
        $set: {
          "paymentProcessingInfo.refund": true,
          "paymentProcessingInfo.refundReferenceId": res.referenceId,
        },
      };
    } else if (action === "void") {
      res = await authorizeNet.voidTransaction(transfer);
      updateQuery = {
        $set: {
          "paymentProcessingInfo.void": true,
          "paymentProcessingInfo.voidReferenceId": res.referenceId,
        },
      };
    } else {
      logger.error(`Invalid action ${action} for transfer ${transfer._id.toString()}.`);
      return false;
    }

    if (!res) {
      logger.error(
        `Failed to void or refund transfer ${transfer._id.toString()}. Action: ${action}`,
      );
      return false;
    }

    if (updateQuery) {
      await Transfer.findByIdAndUpdate(transfer._id, updateQuery);
    }

    logger.info(
      `Successfully voided or refunded transfer ${transfer._id.toString()}. Action: ${action}`,
    );

    return true;
  } catch (error) {
    logger.error(`Error voiding or refunding transfer ${transfer._id.toString()}:`, error);
    return false;
  }
}

module.exports = { voidOrRefundTransfer };
