const { Const } = require("#config");
const Utils = require("#utils");
const { Transfer, Configuration, SmsData } = require("#models");

async function getCustomerActivationData(dateLimit = 0) {
  const { properties: customerActivationData = {} } = await Configuration.findOne({
    type: "general",
    name: "customer-activation",
  }).lean();

  dateLimit = customerActivationData.lastResetDate ?? dateLimit;

  const smsData = await SmsData.aggregate([
    {
      $match: {
        smsType: { $in: ["admin", "invite"] },
        created: { $gt: dateLimit },
        status: "sent",
      },
    },
    {
      $group: {
        _id: "$smsType",
        sum: { $sum: "$price" },
        count: { $sum: 1 },
      },
    },
  ]);

  let adminSum = 0,
    inviteSum = 0;

  for (const item of smsData) {
    if (item._id === "invite") inviteSum = item.sum;
    else adminSum = item.sum;
  }

  customerActivationData.smsAdminSpending = Utils.roundNumber(adminSum / 10000, 2);
  customerActivationData.smsInviteSpending = Utils.roundNumber(inviteSum / 10000, 2);

  const transfers = await Transfer.aggregate([
    {
      $match: {
        bonusType: { $in: [Const.dataForSync, Const.dataForFirstPaymentOrApprovedProduct] },
        created: { $gt: dateLimit },
        status: Const.transferComplete,
      },
    },
    {
      $group: {
        _id: "$bonusType",
        sum: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  let syncSum = 0,
    productSum = 0;

  for (const item of transfers) {
    if (item._id === Const.dataForSync) syncSum = item.sum;
    else productSum = item.sum;
  }

  customerActivationData.dataForFirstPaymentOrApprovedProductSpending = Utils.roundNumber(
    productSum,
    2
  );
  customerActivationData.dataForSyncSpending = Utils.roundNumber(syncSum, 2);

  customerActivationData.totalSpending = Utils.roundNumber(
    customerActivationData.smsAdminSpending +
      customerActivationData.smsInviteSpending +
      customerActivationData.dataForFirstPaymentOrApprovedProductSpending +
      customerActivationData.dataForSyncSpending,
    2
  );

  return customerActivationData;
}

module.exports = getCustomerActivationData;
