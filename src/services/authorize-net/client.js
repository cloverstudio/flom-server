"use strict";

const { Config } = require("#config");
const { APIContracts, APIControllers, Constants: SDKConstants } = require("authorizenet");

function createMerchantAuth() {
  const auth = new APIContracts.MerchantAuthenticationType();
  auth.setName(Config.authorizeApiLoginId);
  auth.setTransactionKey(Config.authorizeTransactionKey);
  return auth;
}

const environment =
  Config.environment !== "development"
    ? SDKConstants.endpoint.production
    : SDKConstants.endpoint.sandbox;

module.exports = Object.freeze({
  APIContracts,
  APIControllers,
  SDKConstants,
  createMerchantAuth,
  environment,
});
