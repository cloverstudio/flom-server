const twilio = require("twilio");
const { Config, Const } = require("#config");
const { BlockedNumber } = require("#models");
const sendRequest = require("./sendRequest");
const formatPhoneNumber = require("./formatPhoneNumber");
const getCountryCodeFromPhoneNumber = require("./getCountryCodeFromPhoneNumber");
const sendEmailWithSG = require("./sendEmailWithSG");

async function checkIfCarrierIsAllowed(phoneNumber) {
  const phoneNumberFormatted = formatPhoneNumber({ phoneNumber });
  const countryCode = getCountryCodeFromPhoneNumber({ phoneNumber });
  const allowedAmericanCarriers = [
    "t-mobile",
    "t-mobile us",
    "t-mobile usa, inc",
    "t-mobile usa, inc.",
    "at&t",
    "at&t mobility",
    "at&t wireless",
    "verizon",
    "verizon wireless",
  ];
  let allowed = false;
  const defaultReturnObject = {
    allowed: false,
    errorCode: Const.responsecodeCarrierNotAllowed,
    errorMessage: "carrier not allowed",
  };

  if (countries[countryCode]?.continent === "AF") return { allowed: true };

  const blockedNumber = await BlockedNumber.findOne({
    phoneNumber: phoneNumberFormatted,
    type: Const.blockedNumberTypeCarrier,
  }).lean();
  if (blockedNumber)
    return {
      allowed: false,
      errorCode: Const.responsecodePhoneNumberIsBlocked,
      errorMessage: `phonenumber ${phoneNumber} is blocked`,
    };

  let carrier = undefined,
    line_type = undefined,
    line_carrier = undefined;

  if (countryCode === "CA") {
    const responseObject = (await getCarrierWithNumLookup(phoneNumberFormatted)) || {};
    line_type = responseObject?.line_type;
    line_carrier = responseObject?.carrier;
    if (!line_type) return defaultReturnObject;
  } else {
    const responseObject = (await getCarrierWithTwilio(phoneNumberFormatted)) || {};
    carrier = responseObject?.carrier;
    if (!carrier) return defaultReturnObject;

    for (let i = 0; i < allowedAmericanCarriers.length; i++)
      if (countryCode === "US" && carrier?.name?.toLowerCase() === allowedAmericanCarriers[i])
        allowed = true;

    if (countryCode === "US" && !allowed) {
      await BlockedNumber.create({
        type: Const.blockedNumberTypeCarrier,
        phoneNumber: phoneNumberFormatted,
        reason: `Carrier ${carrier.name} not allowed`,
      });

      sendEmailWithSG(
        "New registration with banned carrier",
        `New user registration attempt with phone number ${phoneNumberFormatted}, carrier name: ${carrier.name}`,
        Config.blockedNumberEmail
      );

      return defaultReturnObject;
    }
  }

  if (
    carrier?.type === "mobile" ||
    line_type === "mobile" ||
    (line_carrier === "" && line_type === "landline")
  ) {
    return {
      allowed: true,
    };
  } else {
    await BlockedNumber.create({
      type: Const.blockedNumberTypeCarrier,
      phoneNumber: phoneNumberFormatted,
      reason: "Voip carrier not allowed",
    });

    if (carrier) {
      sendEmailWithSG(
        "New registration with voip carrier",
        `New user registration attempt with phone number ${phoneNumberFormatted}, carrier name: ${carrier.name}`,
        Config.blockedNumberEmail
      );
    } else if (line_type) {
      sendEmailWithSG(
        "New registration with voip carrier",
        `New user registration attempt with phone number ${phoneNumberFormatted}, carrier name: ${line_carrier}`,
        Config.blockedNumberEmail
      );
    }

    return defaultReturnObject;
  }
}

async function getCarrierWithTwilio(phoneNumber) {
  const client = twilio(Config.twilio.accountSid, Config.twilio.authToken);
  return client.lookups.phoneNumbers(phoneNumber).fetch({ type: "carrier" });
}

async function getCarrierWithNumLookup(phoneNumber) {
  const result = await sendRequest({
    method: "GET",
    url: `https://api.numlookupapi.com/v1/validate/${phoneNumber}?apikey=${Config.numLookupApiKey}`,
  });
  return result;
}

module.exports = checkIfCarrierIsAllowed;
