const { Const, Config } = require("#config");
const Utils = require("#utils");
const { logger } = require("#infra");
const { Transfer, User, Feedback, ThirdPartyProduct } = require("#models");

const getCustomerActivationData = require("./getCustomerActivationData");
const checkIfBonusAlreadyReceived = require("./checkIfBonusAlreadyReceived");

async function sendBonusData({
  userId,
  bonusType,
  productId = null,
  feedbackId = null,
  conversionRatesToday = {},
  operator,
}) {
  try {
    if (!operator) {
      logger.error("sendBonusData, operator not found");
      return;
    }

    const customerActivationData = await getCustomerActivationData();

    const {
      maxAmountPerUser,
      totalSpending,
      totalSpendingCap,
      sendDataForSync,
      sendDataForFirstPaymentOrApprovedProduct,
    } = customerActivationData;

    if (bonusType === Const.dataForSync && !sendDataForSync) {
      throw new Error("sendBonusData, sync bonus disabled");
    }
    if (
      bonusType === Const.dataForFirstPaymentOrApprovedProduct &&
      !sendDataForFirstPaymentOrApprovedProduct
    ) {
      throw new Error("sendBonusData, product bonus disabled");
    }

    if (totalSpending > totalSpendingCap) {
      throw new Error("sendBonusData, totalSpending higher than totalSpendingCap");
    }

    const user = await User.findById(userId).lean();
    const phoneNumber = user.phoneNumber;

    if (!phoneNumber.startsWith("+234")) {
      return;
    }

    const check = await checkIfBonusAlreadyReceived({
      phoneNumber,
      bonusType,
      productId,
      feedbackId,
    });
    if (check) return;

    const monthlyPlanStringArray = ["monthly", "30 days", "30days", "4week", "4 week"];
    const biWeeklyPlanStringsArray = ["14 days", "14days", "2 week"];
    const weeklyPlanStringsArray = ["7days", "7 days", "weekly", "1 week"];
    const dailyPlanStringsArray = ["1day", "1 day", "daily"];

    const useDefaultPackage =
      bonusType === Const.dataForSync &&
      Object.keys(Const.defaultBonusDataPackages).includes(operator);
    const maxAmountNGN = Const.bonusDataPackageLimits[bonusType];

    let bonusDataPackage = null;
    let amount = null;

    if (useDefaultPackage) {
      bonusDataPackage = await ThirdPartyProduct.findOne({
        provider: "qrios",
        type: "data",
        operator,
        sku: Const.defaultBonusDataPackages[operator],
      });

      if (!bonusDataPackage) {
        logger.error(
          `sendBonusData - default data package not found in db for number: ${phoneNumber} and operator: ${operator}`,
        );
        return;
      }

      amount = bonusDataPackage?.maxAmount;
    } else {
      let dataPackages = await ThirdPartyProduct.find({
        provider: "qrios",
        type: "data",
        operator,
      });

      if (dataPackages.length === 0) {
        logger.error(`sendBonusData - no data packages for number: ${phoneNumber}`);
        return;
      }

      const validDataPackages = dataPackages.filter((packet) => packet.maxAmount <= maxAmountNGN);

      const monthlyPackages = [],
        biWeeklyPackages = [],
        weeklyPackages = [],
        dailyPackages = [];

      for (const package of validDataPackages) {
        if (
          monthlyPlanStringArray.some((el) => package.name.toLowerCase().includes(el.toLowerCase()))
        ) {
          monthlyPackages.push(package);
        }

        if (
          biWeeklyPlanStringsArray.some((el) =>
            package.name.toLowerCase().includes(el.toLowerCase()),
          )
        ) {
          biWeeklyPackages.push(package);
        }

        if (
          weeklyPlanStringsArray.some((el) => package.name.toLowerCase().includes(el.toLowerCase()))
        ) {
          weeklyPackages.push(package);
        }

        if (
          dailyPlanStringsArray.some((el) => package.name.toLowerCase().includes(el.toLowerCase()))
        ) {
          dailyPackages.push(package);
        }

        monthlyPackages.sort((a, b) => a.maxAmount - b.maxAmount);
        biWeeklyPackages.sort((a, b) => a.maxAmount - b.maxAmount);
        weeklyPackages.sort((a, b) => a.maxAmount - b.maxAmount);
        dailyPackages.sort((a, b) => a.maxAmount - b.maxAmount);
      }

      switch (bonusType) {
        case "dataForSync":
          bonusDataPackage = bonusDataPackage || monthlyPackages[0] || biWeeklyPackages[0];
          amount = bonusDataPackage?.maxAmount;
          break;
        case "dataForFeedback":
        case "dataForFirstPaymentOrApprovedProduct":
          bonusDataPackage =
            bonusDataPackage || biWeeklyPackages[0] || weeklyPackages[0] || dailyPackages[0];
          amount = bonusDataPackage?.maxAmount;
          break;
        default:
          logger.error("sendBonusData - bonusType unknown");
          return;
      }
    }

    if (!amount) {
      logger.error(
        `sendBonusData - Data package not found for this phonenumber's carrier: ${phoneNumber}, no bonus package awarded`,
      );
      return;
    }

    const NGNtoUSDRatio = conversionRatesToday.rates["NGN"];
    const amountUSD = Math.floor((amount / NGNtoUSDRatio) * 100) / 100;

    if (amountUSD > maxAmountPerUser) {
      logger.error(
        "sendBonusData - Price of smallest monthly data package higher than maxAmountPerUser",
      );
      return;
    }
    if (amount > maxAmountNGN) {
      logger.error(
        `sendBonusData - Price of smallest monthly data package higher than maximum for this bonus type: ${maxAmountNGN} NGN`,
      );
      return;
    }
    if (totalSpending + amountUSD > totalSpendingCap) {
      logger.error(
        "sendBonusData - package price goes over totalSpendingCap, data package will not be added",
      );
      return;
    }

    if (Config.environment === "production") {
      const balanceCheck = await Utils.checkQriosBalance(amount);
      if (!balanceCheck) {
        logger.error("sendBonusData - Qrios balance insufficient!");
        return;
      }
    }

    const flomAgent = await User.findById(Config.flomSupportAgentId).lean();

    const transferData = {
      senderId: Config.flomSupportAgentId,
      senderPhoneNumber: flomAgent.phoneNumber || "FLOM",
      receiverId: userId,
      receiverPhoneNumber: phoneNumber,
      receiverCarrier: operator,
      sku: bonusDataPackage.sku.toString(),
      source: "flom_v1",
      amount: amountUSD,
      originalPrice: { countryCode: "NG", currency: "NGN", value: amount },
      status: Const.transferWaitingForFulfillment,
      paymentMethodType: Const.paymentMethodTypeInternal,
      transferType: Const.transferTypeData,
      productName: bonusDataPackage.name ? `Bonus data: ${bonusDataPackage.name}` : "Bonus data",
      localAmountSender: { countryCode: "US", currency: "USD", value: amountUSD },
      localAmountReceiver: {
        countryCode: "NG",
        currency: "NGN",
        value: amount,
      },
      bonusType,
      created: Date.now(),
    };
    if (productId) {
      transferData.productId = productId;
    }
    if (feedbackId) {
      transferData.feedbackId = feedbackId;
    }

    const res = await Transfer.create(transferData);
    const transferId = res._id.toString();

    const dataRechargeUrl = "https://deep.qrios.com/api/v1/acquire";
    const airtimeOperationId = `Flom-MobileData-${transferId.toString()}`;
    const airtimeData = {
      operationId: airtimeOperationId,
      acquirerMsisdn: phoneNumber,
      amount,
      sku: bonusDataPackage.sku.toString(),
    };

    await Transfer.findByIdAndUpdate(transferId, {
      airtimeOperationId,
      airtimeAPIRequest: airtimeData,
    });

    let dataRechargeApiResponse;

    if (Config.environment !== "production") {
      dataRechargeApiResponse = "DEV";
    } else {
      try {
        dataRechargeApiResponse = await Utils.sendRequest({
          method: "POST",
          url: dataRechargeUrl,
          headers: Config.qriosHeaders,
          body: airtimeData,
        });
      } catch (error) {
        await Transfer.findByIdAndUpdate(transferId, {
          status: Const.transferFulfillmentFailed,
          airtimeAPIResponse: error.message,
        });
        logger.error("sendBonusData - Data recharge API", error);
        return;
      }
    }

    await Transfer.findByIdAndUpdate(transferId, {
      airtimeAPIResponse: dataRechargeApiResponse,
    });

    if (bonusType === "dataForFeedback") {
      await Feedback.findByIdAndUpdate(feedbackId, {
        operationId: airtimeOperationId,
        sentGift: 1,
      });
    }

    if (Config.environment !== "production") {
      const callbackBody = { ...Const.airtimeCallback };
      callbackBody.airtimeOperationId = airtimeOperationId;

      await Utils.sendRequest({
        method: "POST",
        url: `${Config.paymentServiceBaseUrl}/payment/cb/qrios`,
        body: callbackBody,
      });
    }

    return;
  } catch (error) {
    logger.error("sendBonusData", error);

    return;
  }
}

module.exports = sendBonusData;
