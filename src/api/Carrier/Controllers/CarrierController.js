"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Configuration, ThirdPartyProduct } = require("#models");

/**
 * @api {get} /api/v2/carriers/list New carrier info list
 * @apiVersion 2.0.7
 * @apiName New carrier info list
 * @apiGroup WebAPI Carrier
 * @apiDescription Returns list of carrier info.
 *
 * @apiHeader {String} UUID UUID of the device.
 *
 * @apiParam (Query string) {String} phoneNumber Phone numbers (one or multiple) for which to return the list of available carriers
 * (query should look like this "?phoneNumber=38597774088&phoneNumber=385952215886")
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635498618078,
 *   "data": {
 *     "carriers": [
 *       {
 *         "phoneNumber": "+2348020000011",
 *         "carriers": [
 *           {
 *             "name": "9mobile",
 *             "logoLink": "https://dev-old.flom.app/api/v2/carriers/logo/9mobile",
 *             "topUpPackets": [
 *               {
 *                 "sku": 1,
 *                 "amount": 5,
 *                 "maxAmount": 200
 *               },
 *               {
 *                 "sku": 2,
 *                 "amount": 10,
 *                 "maxAmount": 200
 *               }
 *             ],
 *             "selected": false,
 *             "dataPackets": [
 *               {
 *                 "amount": 5.71,
 *                 "packets": [
 *                   {
 *                     "name": "9Mobile monthly 4.5GB",
 *                     "sku": 4007
 *                   }
 *                 ]
 *               },
 *               {
 *                 "amount": 11.43,
 *                 "packets": [
 *                   {
 *                     "name": "9Mobile monthly 11GB",
 *                     "sku": 4009
 *                   }
 *                 ]
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 400180 No phoneNumber parameter
 * @apiError (Errors) 443107 Invalid phoneNumber parameter. Will return this error if none of given phone numbers are valid
 */

router.get("/list", auth({ allowUser: true }), async function (request, response) {
  try {
    let phoneNumbers = request.query.phoneNumber;
    if (typeof phoneNumbers === "string") {
      phoneNumbers = [request.query.phoneNumber];
    }

    if (phoneNumbers) {
      phoneNumbers = phoneNumbers.filter((number) => !number.startsWith("Deleted_user"));
    }

    if (!phoneNumbers || !phoneNumbers.length) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoPhoneNumber,
        message: `CarrierController - list, no phoneNumber`,
      });
    }

    const formattedPhoneNumbers = [];
    const countryCodesSet = new Set();
    let getPpn = false,
      getQrios = false;
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneObj = {};

      const phoneNumber = Utils.formatPhoneNumber({ phoneNumber: phoneNumbers[i] });

      if (phoneNumber) {
        phoneObj.phoneNumber = phoneNumber;
      } else {
        logger.warn(`CarrierController, invalid phone number: ${phoneNumbers[i]}`);
        continue;
      }

      const countryCode = Utils.getCountryCodeFromPhoneNumber({ phoneNumber });

      phoneObj.countryCode = countryCode;
      countryCodesSet.add(countryCode);
      if (countryCode === "NG") {
        getQrios = true;
      } else {
        getPpn = true;
      }

      phoneObj.defaultCarrier = (await Utils.getCarrier({ phoneNumber, countryCode })) || "";

      formattedPhoneNumbers.push(phoneObj);
    }

    if (!formattedPhoneNumbers.length) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidPhoneNumber,
        message: `CarrierController - list, invalid phoneNumber`,
      });
    }

    const { userCountryCode, userCurrency, conversionRates } = await Utils.getUsersConversionRate({
      user: request.user,
      accessToken: request.headers["access-token"],
    });

    const { dataPackages, topUpPackages, operators } = await getAllAirtimeProductsByCountry({
      countryCodes: Array.from(countryCodesSet),
      userCountryCode,
      userCurrency,
      conversionRates,
      getPpn,
      getQrios,
    });

    const carriers = [];

    for (const phone of formattedPhoneNumbers) {
      const phoneObj = {
        phoneNumber: phone.phoneNumber,
        carriers: [],
      };

      const dataByOperator = dataPackages[phone.countryCode] || [];
      const topUpByOperator = topUpPackages[phone.countryCode] || [];
      const operatorsArray = operators[phone.countryCode] || [];

      let isAnyOperatorSelected = false;
      for (const operator of operatorsArray) {
        if (operator.name && operator.name.toLowerCase() === phone.defaultCarrier.toLowerCase()) {
          isAnyOperatorSelected = true;
        }

        const dataToPush = {
          name: operator.name,
          logoLink: operator.logoUrl,
          topUpPackets: topUpByOperator[operator.name] ?? [],
          dataPackets: dataByOperator[operator.name] ?? [],
          selected:
            operator.name && operator.name.toLowerCase() === phone.defaultCarrier.toLowerCase(),
        };

        phoneObj.carriers.push(dataToPush);
      }

      if (!isAnyOperatorSelected && operatorsArray.length > 0) {
        phoneObj.carriers[0].selected = true;
      }

      carriers.push(phoneObj);
    }

    Base.successResponse(response, Const.responsecodeSucceed, { carriers });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CarrierController - list",
      error,
    });
  }
});

async function getAllAirtimeProductsByCountry({
  countryCodes = [],
  userCountryCode,
  userCurrency,
  conversionRates,
  getPpn = false,
  getQrios = false,
}) {
  if (countryCodes.length === 0) {
    logger.warn("CarrierController, getAllAirtimeProductsByCountry - no country codes!");
  }

  const rates = conversionRates.rates;

  const dataPackages = {},
    topUpPackages = {},
    operators = {},
    operatorLogosByCountryCode = {};

  const allProducts = await ThirdPartyProduct.find({
    countryCode: { $in: countryCodes },
    type: { $in: ["data", "top-up"] },
  }).lean();

  const ppnTopUpMultiplier =
    (
      await Configuration.findOne({
        name: "topUpMultiplier",
      })
    )?.value || 1;
  const qriosTopUpMultiplier = 1;

  operatorLogosByCountryCode["NG"] = Const.nigerianCarrierLogos;

  const mappedProductsByCountryAndType = {};

  for (const product of allProducts) {
    const { provider, type, countryCode, operator, currencyCode, logoUrl } = product;

    if (provider === "ppn") {
      if (!operatorLogosByCountryCode[countryCode]) operatorLogosByCountryCode[countryCode] = {};
      operatorLogosByCountryCode[countryCode][operator] = await Utils.getPpnLogoImage({
        carrier: operator,
        countryCode,
        sku: +product.sku,
      });
    } else {
      if (!operatorLogosByCountryCode[countryCode]) operatorLogosByCountryCode[countryCode] = {};
      operatorLogosByCountryCode[countryCode][operator] = logoUrl;
    }

    if (currencyCode !== "USD" && currencyCode !== "NGN") {
      product.minAmount = Utils.roundNumber(product.minAmount / product.exchangeRate, 2);
      product.maxAmount = Utils.roundNumber(product.maxAmount / product.exchangeRate, 2);
      product.currencyCode = "USD";
    }

    if (!mappedProductsByCountryAndType[countryCode])
      mappedProductsByCountryAndType[countryCode] = {};
    if (!mappedProductsByCountryAndType[countryCode][type])
      mappedProductsByCountryAndType[countryCode][type] = [];

    mappedProductsByCountryAndType[countryCode][type].push(product);
  }

  for (const countryCode in mappedProductsByCountryAndType) {
    const { dataByOperator, dataOperatorsSet } = organizeCountrysDataProducts({
      countryCode,
      dataProducts: mappedProductsByCountryAndType[countryCode]?.data ?? [],
      userCountryCode,
      userCurrency,
      rates,
    });

    const { topUpByOperator, topUpOperatorsSet } = organizeCountrysTopUpProducts({
      countryCode,
      topUpProducts: mappedProductsByCountryAndType[countryCode]?.["top-up"] ?? [],
      userCountryCode,
      userCurrency,
      rates,
      ppnTopUpMultiplier,
      qriosTopUpMultiplier,
    });

    dataPackages[countryCode] = dataByOperator;
    topUpPackages[countryCode] = topUpByOperator;
    const operatorsSet = new Set([...dataOperatorsSet, ...topUpOperatorsSet]);
    operators[countryCode] = Array.from(operatorsSet).map((operator) => {
      return {
        name: operator,
        logoUrl: operatorLogosByCountryCode[countryCode][operator],
      };
    });
  }

  return { dataPackages, topUpPackages, operators };
}

function organizeCountrysDataProducts({
  countryCode,
  dataProducts,
  userCountryCode,
  userCurrency,
  rates,
}) {
  if (!dataProducts || !dataProducts.length || dataProducts.length === 0) {
    logger.warn(
      "CarrierController, organizeCountrysDataProducts - no data products for country: " +
        countryCode,
    );
  }

  const dataByOperatorAndPrice = {},
    dataOperatorsSet = new Set();

  for (const product of dataProducts) {
    const { operator, sku, name, minAmount: amount } = product;

    if (!dataByOperatorAndPrice[operator]) dataByOperatorAndPrice[operator] = {};
    if (!dataByOperatorAndPrice[operator][amount]) dataByOperatorAndPrice[operator][amount] = [];

    dataByOperatorAndPrice[operator][amount].push({ name, sku: +sku });
  }

  const dataByOperator = {};

  for (const operator in dataByOperatorAndPrice) {
    const dataByPrice = dataByOperatorAndPrice[operator];
    dataOperatorsSet.add(operator);

    const dataByPriceArray = [];

    for (const price in dataByPrice) {
      const amountRaw = +price;

      let amountUSD, originalPrice;
      if (countryCode === "NG") {
        amountUSD = Utils.roundNumber(amountRaw / rates["NGN"], 16);
        originalPrice = { countryCode: "NG", currency: "NGN", value: amountRaw };
      } else {
        amountUSD = amountRaw;
        originalPrice = { countryCode: "US", currency: "USD", value: amountRaw };
      }

      const dataToPush = {
        amount: amountUSD,
        originalPrice,
        userPrice: {
          countryCode: userCountryCode,
          currency: userCurrency,
          value: Utils.roundNumber(amountUSD * rates[userCurrency], 2),
        },
        packets: dataByPrice[price],
      };

      dataByPriceArray.push(dataToPush);
    }

    dataByPriceArray.sort((a, b) => a.amount - b.amount);
    dataByOperator[operator] = dataByPriceArray;
  }

  return { dataByOperator, dataOperatorsSet };
}

function organizeCountrysTopUpProducts({
  countryCode,
  topUpProducts,
  userCountryCode,
  userCurrency,
  rates,
  ppnTopUpMultiplier,
  qriosTopUpMultiplier,
}) {
  if (!topUpProducts || !topUpProducts.length || topUpProducts.length === 0) {
    logger.warn(
      "CarrierController, organizeCountrysPpnTopUpProducts - no top-up products for country: " +
        countryCode,
    );
    return { topUpByOperator: {}, topUpOperatorsSet: new Set() };
  }

  const topUpMultiplier = countryCode === "NG" ? qriosTopUpMultiplier : ppnTopUpMultiplier;

  const topUpOperatorsSet = new Set();

  const singleTopUpsByOperator = {},
    regularTopUpsByOperator = {};

  for (const product of topUpProducts) {
    const { minAmount, maxAmount, operator, sku } = product;
    topUpOperatorsSet.add(operator);

    if (minAmount === maxAmount) {
      if (!singleTopUpsByOperator[operator]) {
        singleTopUpsByOperator[operator] = [];
      }
      singleTopUpsByOperator[operator].push(product);
    } else {
      if (!regularTopUpsByOperator[operator]) {
        regularTopUpsByOperator[operator] = [];
      }

      let topUpAmount = minAmount;
      const topUpMaxAmount = maxAmount < Const.ppnTopUpMax ? maxAmount : Const.ppnTopUpMax;
      while (topUpAmount * topUpMultiplier <= topUpMaxAmount) {
        const originalCountryCode = countryCode === "NG" ? "NG" : "US";
        const originalCurrencyCode = countryCode === "NG" ? "NGN" : "USD";
        const originalRateMultiplier = countryCode === "NG" ? rates["NGN"] : 1;

        regularTopUpsByOperator[operator].push({
          sku: +sku,
          amount: topUpAmount,
          maxAmount: topUpMaxAmount,
          originalPrice: {
            countryCode: originalCountryCode,
            currency: originalCurrencyCode,
            value: Utils.roundNumber(topUpAmount * originalRateMultiplier, 2),
          },
          originalMaxPrice: {
            countryCode: originalCountryCode,
            currency: originalCurrencyCode,
            value: Utils.roundNumber(topUpMaxAmount * originalRateMultiplier, 2),
          },
          userPrice: {
            countryCode: userCountryCode,
            currency: userCurrency,
            value: Utils.roundNumber(topUpAmount * rates[userCurrency], 2),
          },
          userMaxPrice: {
            countryCode: userCountryCode,
            currency: userCurrency,
            value: Utils.roundNumber(topUpMaxAmount * rates[userCurrency], 2),
          },
        });

        if (topUpAmount === 1) {
          topUpAmount += 4;
        } else {
          topUpAmount += Const.topUpAmountStep;
        }
      }

      regularTopUpsByOperator[operator].sort((a, b) => a.amount - b.amount);
    }
  }

  if (Object.keys(singleTopUpsByOperator).length > 0) {
    organizeSingleTopUpProducts({
      singleTopUpsByOperator,
      userCountryCode,
      userCurrency,
      rates,
      topUpMultiplier,
    });
  }

  const topUpByOperator = { ...regularTopUpsByOperator, ...singleTopUpsByOperator };

  return { topUpByOperator, topUpOperatorsSet };
}

function organizeSingleTopUpProducts({
  singleTopUpsByOperator = {},
  userCountryCode,
  userCurrency,
  rates,
  topUpMultiplier,
}) {
  for (const operator in singleTopUpsByOperator) {
    const topUps = singleTopUpsByOperator[operator];
    topUps.sort((a, b) => a.maxAmount - b.maxAmount);
    const maxAmount = topUps[topUps.length - 1].maxAmount;

    for (let i = 0; i < topUps.length; i++) {
      const product = topUps[i];
      const { minAmount, sku } = product;

      const newData = {
        sku: +sku,
        amount: Utils.roundNumber(minAmount * topUpMultiplier, 2),
        maxAmount,
        originalPrice: {
          countryCode: "US",
          currency: "USD",
          value: Utils.roundNumber(minAmount * topUpMultiplier, 2),
        },
        originalMaxPrice: {
          countryCode: "US",
          currency: "USD",
          value: Utils.roundNumber(maxAmount * topUpMultiplier, 2),
        },
        userPrice: {
          countryCode: userCountryCode,
          currency: userCurrency,
          value: Utils.roundNumber(minAmount * topUpMultiplier * rates[userCurrency], 2),
        },
        userMaxPrice: {
          countryCode: userCountryCode,
          currency: userCurrency,
          value: Utils.roundNumber(maxAmount * topUpMultiplier * rates[userCurrency], 2),
        },
      };

      topUps[i] = newData;
    }
  }
}

module.exports = router;
