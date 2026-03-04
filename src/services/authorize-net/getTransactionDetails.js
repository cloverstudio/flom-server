"use strict";

const { APIContracts, APIControllers, createMerchantAuth, environment } = require("./client");
const { logger } = require("#infra");

module.exports = async function (transfer) {
  try {
    const merchantAuthenticationType = createMerchantAuth();

    const newRequest = new APIContracts.GetTransactionDetailsRequest();
    newRequest.setMerchantAuthentication(merchantAuthenticationType);
    newRequest.setTransId(transfer.paymentProcessingInfo.referenceId);

    const controller = new APIControllers.GetTransactionDetailsController(newRequest.getJSON());
    controller.setEnvironment(environment);

    return new Promise((resolve, reject) => {
      controller.execute(() => {
        const apiResponse = controller.getResponse();
        const response = new APIContracts.GetTransactionDetailsResponse(apiResponse);
        if (response != null) {
          if (response.getMessages().getResultCode() == APIContracts.MessageTypeEnum.OK) {
            resolve({
              referenceId: response.transaction.transId.toString(),
              ...response.transaction,
            });
          } else {
            logger.warn("Error Code: " + response.getMessages().getMessage()[0].getCode());
            logger.warn("Error message: " + response.getMessages().getMessage()[0].getText());
            resolve(null);
          }
        } else {
          logger.warn("Null Response.");
          resolve(null);
        }
      });
    });
  } catch (error) {
    logger.error(`Error in getTransactionDetails: ${error.message}`);
    return null;
  }
};
