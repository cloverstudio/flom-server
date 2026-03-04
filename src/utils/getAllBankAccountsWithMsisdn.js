const { Config } = require("#config");
const sendRequest = require("./sendRequest");

async function getAllBankAccountsWithMsisdn(phoneNumber) {
  console.log(
    "getAllBankAccountsWithMsisdn URL: " +
      Config.GetAllBankAccountsWithMsisdn +
      phoneNumber.replace("+234", "234")
  );

  const responseData = await sendRequest({
    method: "GET",
    url: Config.GetAllBankAccountsWithMsisdn + phoneNumber.replace("+234", "234"),
    auth: {
      username: "flom",
      password: "^4FdK295S",
    },
  });

  if (!responseData.outlet) {
    return [];
  }

  return responseData.outlet.terminals
    .filter(({ shortCode, accountNumber }) => shortCode && shortCode.length === 8 && accountNumber)
    .map(({ shortCode, name, institution, accountNumber }, i) => ({
      merchantCode: shortCode,
      businessName: name,
      name,
      bankName: institution === null ? "FBN" : institution,
      code: institution === null ? "011" : "",
      accountNumber,
      selected: i === 0,
    }));
}

module.exports = getAllBankAccountsWithMsisdn;
