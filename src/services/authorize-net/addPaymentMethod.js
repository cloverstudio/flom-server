"use strict";

const { countries2to3 } = require("#config");
const { APIContracts, APIControllers, createMerchantAuth, environment } = require("./client");

async function addPaymentMethod({
  cardNumber,
  expirationDate,
  firstName,
  lastName,
  address,
  zip,
  countryCode,
  paymentProfileId,
}) {
  const merchantAuthenticationType = createMerchantAuth();

  const creditCard = new APIContracts.CreditCardType({
    cardNumber,
    expirationDate,
  });

  const paymentType = new APIContracts.PaymentType({ creditCard });

  const billTo = new APIContracts.CustomerAddressType();
  if (firstName) {
    billTo.setFirstName(firstName);
  }
  if (lastName) {
    billTo.setLastName(lastName);
  }
  billTo.setAddress(address);
  billTo.setZip(zip);
  if (countryCode) {
    billTo.setCountry(countries2to3[countryCode]);
  }

  const profile = new APIContracts.CustomerPaymentProfileType();
  profile.setBillTo(billTo);
  profile.setPayment(paymentType);

  let newRequest = new APIContracts.CreateCustomerPaymentProfileRequest();

  newRequest.setMerchantAuthentication(merchantAuthenticationType);
  newRequest.setCustomerProfileId(paymentProfileId);
  newRequest.setPaymentProfile(profile);
  newRequest.setValidationMode(APIContracts.ValidationModeEnum.TESTMODE);

  const controller = new APIControllers.CreateCustomerPaymentProfileController(
    newRequest.getJSON(),
  );

  controller.setEnvironment(environment);

  console.log("Sending request to add payment method.");

  return new Promise((resolve, reject) => {
    controller.execute(() => {
      const apiResponse = controller.getResponse();
      const response = new APIContracts.UpdateCustomerPaymentProfileResponse(apiResponse);

      console.log("Response arrived.");
      //pretty print response
      //console.log(JSON.stringify(response, null, 2));

      if (response != null) {
        if (response.getMessages().getResultCode() == APIContracts.MessageTypeEnum.OK) {
          console.log("Successfully added a customer payment profile");
          resolve();
        } else {
          console.warn("Result Code: " + response.getMessages().getResultCode());
          console.warn("Error Code: " + response.getMessages().getMessage()[0].getCode());
          console.warn("Error message: " + response.getMessages().getMessage()[0].getText());
          reject({
            resultCode: response.getMessages().getResultCode(),
            errorCode: response.getMessages().getMessage()[0].getCode(),
            message: response.getMessages().getMessage()[0].getText(),
          });
        }
      } else {
        console.warn("Null response received");
        reject({ code: 0, message: "Null Response." });
      }
    });
  });
}

module.exports = addPaymentMethod;
