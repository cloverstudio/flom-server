"use strict";

const { APIContracts, APIControllers, createMerchantAuth, environment } = require("./client");

const deleteSavedPaymentMethod = async ({ paymentProfileId, paymentMethodId }) => {
  const merchantAuthenticationType = createMerchantAuth();

  const newRequest = new APIContracts.DeleteCustomerPaymentProfileRequest();
  newRequest.setMerchantAuthentication(merchantAuthenticationType);
  newRequest.setCustomerProfileId(paymentProfileId);
  newRequest.setCustomerPaymentProfileId(paymentMethodId);

  console.log("Request to delete saved payment method prepared.");

  const controller = new APIControllers.DeleteCustomerPaymentProfileController(
    newRequest.getJSON(),
  );

  controller.setEnvironment(environment);

  console.log("Sending request to delete saved payment method.");

  return new Promise((resolve, reject) => {
    controller.execute(() => {
      const apiResponse = controller.getResponse();
      const response = new APIContracts.GetCustomerProfileResponse(apiResponse);

      console.log("Response arrived.");

      if (response != null) {
        if (response.getMessages().getResultCode() == APIContracts.MessageTypeEnum.OK) {
          console.log(
            "Successfully deleted a user saved payment method with id: " + paymentMethodId,
          );
          resolve();
        } else {
          console.warn("Error Code: " + response.getMessages().getMessage()[0].getCode());
          console.warn("Error message: " + response.getMessages().getMessage()[0].getText());
          reject({
            code: response.getMessages().getMessage()[0].getCode(),
            message: response.getMessages().getMessage()[0].getText(),
          });
        }
      } else {
        console.warn("Null Response.");
        reject({ code: 0, message: "Null Response." });
      }
    });
  });
};

module.exports = deleteSavedPaymentMethod;
