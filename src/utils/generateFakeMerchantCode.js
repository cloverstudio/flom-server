const { User } = require("#models");
const generateRandomNumber = require("./generateRandomNumber");

async function generateFakeMerchantCode() {
  let merchantCode,
    finished = false;
  do {
    merchantCode = generateRandomNumber(8).toString();
    const exists = await User.findOne(
      { "bankAccounts.merchantCode": merchantCode },
      { _id: 1 }
    ).lean();
    if (!exists) {
      finished = true;
    }
  } while (!finished);
  return merchantCode;
}

module.exports = generateFakeMerchantCode;
