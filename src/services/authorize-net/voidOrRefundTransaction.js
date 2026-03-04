"use strict";

const { APIContracts, APIControllers, createMerchantAuth, environment } = require("./client");
const { logger } = require("#infra");

function voidTransaction(transfer) {
  return voidOrRefundTransaction(transfer, "void");
}
function refundTransaction(transfer) {
  return voidOrRefundTransaction(transfer, "refund");
}

async function voidOrRefundTransaction(transfer, transactionType) {
  try {
    const merchantAuthenticationType = createMerchantAuth();

    const transactionRequestType = new APIContracts.TransactionRequestType();
    if (transactionType === "void") {
      transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.VOIDTRANSACTION);
    } else if (transactionType === "refund") {
      transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.REFUNDTRANSACTION);
    }
    transactionRequestType.setRefTransId(transfer.paymentProcessingInfo.referenceId);

    if (transactionType === "refund") {
      const creditCard = new APIContracts.CreditCardType();
      creditCard.setCardNumber(transfer.creditCardLastDigits);
      creditCard.setExpirationDate("XXXX");
      const paymentType = new APIContracts.PaymentType();
      paymentType.setCreditCard(creditCard);

      transactionRequestType.setPayment(paymentType);
      transactionRequestType.setAmount(transfer.amount);
    }

    const newRequest = new APIContracts.CreateTransactionRequest();
    newRequest.setMerchantAuthentication(merchantAuthenticationType);
    newRequest.setTransactionRequest(transactionRequestType);

    const controller = new APIControllers.CreateTransactionController(newRequest.getJSON());

    controller.setEnvironment(environment);

    return new Promise((resolve, reject) => {
      controller.execute(() => {
        const apiResponse = controller.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (response != null) {
          if (response.getMessages().getResultCode() == APIContracts.MessageTypeEnum.OK) {
            if (response.getTransactionResponse().getMessages() != null) {
              logger.info("Transaction ID: " + response.getTransactionResponse().getTransId());
              logger.info("Response Code: " + response.getTransactionResponse().getResponseCode());
              logger.info(
                "Message Code: " +
                  response.getTransactionResponse().getMessages().getMessage()[0].getCode(),
              );
              logger.info(
                "Description: " +
                  response.getTransactionResponse().getMessages().getMessage()[0].getDescription(),
              );

              resolve({
                referenceId: response.getTransactionResponse().getTransId(),
                code: response.getTransactionResponse().getMessages().getMessage()[0].getCode(),
                message: response
                  .getTransactionResponse()
                  .getMessages()
                  .getMessage()[0]
                  .getDescription(),
                paymentProfileId: response.getProfileResponse()
                  ? response.getProfileResponse().getCustomerProfileId()
                  : null,
              });
            } else {
              logger.warn("Failed Transaction.");
              if (response.getTransactionResponse().getErrors() != null) {
                logger.warn(
                  "Error Code: " +
                    response.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
                );
                logger.warn(
                  "Error message: " +
                    response.getTransactionResponse().getErrors().getError()[0].getErrorText(),
                );
              }

              resolve(false);
            }
          } else {
            logger.warn("Failed Transaction.");
            if (
              response.getTransactionResponse() != null &&
              response.getTransactionResponse().getErrors() != null
            ) {
              logger.warn(
                "Error Code: " +
                  response.getTransactionResponse().getErrors().getError()[0].getErrorCode(),
              );
              logger.warn(
                "Error message: " +
                  response.getTransactionResponse().getErrors().getError()[0].getErrorText(),
              );
            } else {
              logger.warn("Error Code: " + response.getMessages().getMessage()[0].getCode());
              logger.warn("Error message: " + response.getMessages().getMessage()[0].getText());
            }

            resolve(false);
          }
        } else {
          logger.warn("Null Response.");
          resolve(false);
        }
      });
    });
  } catch (error) {
    logger.error(`Error in voidOrRefundTransaction: ${error.message}`);
    return false;
  }
}

module.exports = { voidTransaction, refundTransaction };
