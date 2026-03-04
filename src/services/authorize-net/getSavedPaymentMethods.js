"use strict";

const { APIContracts, APIControllers, createMerchantAuth, environment } = require("./client");

const getSavedPaymentMethods = async (paymentProfileId) => {
  const merchantAuthenticationType = createMerchantAuth();

  const newRequest = new APIContracts.GetCustomerProfileRequest();
  newRequest.setCustomerProfileId(paymentProfileId);
  newRequest.setMerchantAuthentication(merchantAuthenticationType);
  newRequest.setUnmaskExpirationDate(true);

  console.log("Request to get customer profile prepared.");

  const controller = new APIControllers.CreateTransactionController(newRequest.getJSON());

  controller.setEnvironment(environment);

  console.log("Sending request to get customer profile.");

  return new Promise((resolve, reject) => {
    controller.execute(() => {
      const apiResponse = controller.getResponse();
      const response = new APIContracts.GetCustomerProfileResponse(apiResponse);

      console.log("Response to get customer profile arrived.");
      //console.log(response.getProfile());
      if (response != null) {
        if (response.getMessages().getResultCode() == APIContracts.MessageTypeEnum.OK) {
          console.log(
            "Got customer with profile ID : " + response.getProfile().getCustomerProfileId(),
          );
          if (response.getProfile().getPaymentProfiles()) {
            resolve(response.getProfile().getPaymentProfiles());
          } else {
            resolve([]);
          }
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

module.exports = getSavedPaymentMethods;
