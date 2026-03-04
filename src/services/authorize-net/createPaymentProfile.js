"use strict";

const { countries2to3 } = require("#config");
const { APIContracts, APIControllers, createMerchantAuth, environment } = require("./client");
const Utils = require("#utils");

const createPaymentProfile = async ({
  cardNumber,
  expirationDate,
  cardCode,
  firstName,
  lastName,
  address,
  zip,
  countryCode,
}) => {
  const merchantAuthenticationType = createMerchantAuth();

  const creditCard = new APIContracts.CreditCardType({
    cardNumber,
    expirationDate,
    cardCode,
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

  const paymentProfilesList = [];
  paymentProfilesList.push(profile);

  const customerProfile = new APIContracts.CustomerProfileType();
  customerProfile.setMerchantCustomerId(Utils.getRandomString(20));
  customerProfile.setPaymentProfiles(paymentProfilesList);

  const newRequest = new APIContracts.CreateCustomerProfileRequest();
  newRequest.setProfile(customerProfile);
  newRequest.setValidationMode(APIContracts.ValidationModeEnum.TESTMODE);
  newRequest.setMerchantAuthentication(merchantAuthenticationType);

  console.log("Request to create customer profile prepared.");

  const controller = new APIControllers.CreateCustomerProfileController(newRequest.getJSON());

  controller.setEnvironment(environment);

  console.log("Sending request to create customer profile.");

  return new Promise((resolve, reject) => {
    controller.execute(() => {
      const apiResponse = controller.getResponse();
      const response = new APIContracts.CreateCustomerProfileResponse(apiResponse);

      console.log("Response arrived.");
      //console.log(response);
      if (response != null) {
        if (response.getMessages().getResultCode() == APIContracts.MessageTypeEnum.OK) {
          console.log("Created customer with profile ID : " + response.getCustomerProfileId());
          resolve({
            paymentProfileId: response.getCustomerProfileId(),
            paymentMethodIdList: response.getCustomerPaymentProfileIdList().numericString,
          });
        } else {
          console.warn("Result Code: " + response.getMessages().getResultCode());
          console.warn("Error Code: " + response.getMessages().getMessage()[0].getCode());
          console.warn("Error message: " + response.getMessages().getMessage()[0].getText());
          reject({
            resultCode: response.getMessages().getResultCode(),
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

module.exports = createPaymentProfile;
