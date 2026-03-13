const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User } = require("#models");

async function updateUsersBankAccounts({ user, test = false }) {
  try {
    if (!user.phoneNumber.startsWith("+234")) return;
    if (
      user.bankAccountsLastUpdated &&
      user.bankAccountsLastUpdated > Date.now() - Const.dayInMs * 14
    )
      return;

    const accountsFromProfile = user.bankAccounts || [];

    let accountsFromTerminalsApi;

    try {
      accountsFromTerminalsApi = await Utils.getAllBankAccountsWithMsisdn(user.phoneNumber);
    } catch (error) {
      if (Config.environment === "production") {
        console.log("updateUsersBankAccounts failed to fetch NG user's bank accounts from API");
        console.error("updateUsersBankAccounts failed to fetch NG user's bank accounts from API");
      }
      return;
    }

    const difference = accountsFromTerminalsApi.filter((account) => {
      account.selected = false;
      return !accountsFromProfile.some(
        (profileAccount) =>
          account.code === profileAccount.code &&
          account.accountNumber === profileAccount.accountNumber,
      );
    });

    if (difference.length === 0) {
      await User.updateOne({ _id: user._id.toString() }, { bankAccountsLastUpdated: Date.now() });

      return;
    } else if (accountsFromProfile.length === 0) {
      difference[0].selected = true;
    }

    const baseUrl = Config.environment === "production" ? "flom.app" : "flom.dev";

    difference.forEach((account) => {
      account.lightningUserName = account.merchantCode;
      account.lightningAddress = `${account.lightningUserName}@${baseUrl}`;
      const lnUrl = `https://${baseUrl}/.well-known/lnurlp/${account.lightningUserName}`;
      account.lightningUrlEncoded = Utils.encodeLnUrl(lnUrl);
    });

    if (!test) {
      await User.updateOne(
        { _id: user._id.toString() },
        {
          $push: { bankAccounts: { $each: difference } },
          $set: { bankAccountsLastUpdated: Date.now() },
        },
      );
    } else {
      console.log("Profile: ", accountsFromProfile);
      console.log("API: ", accountsFromTerminalsApi);
      console.log("Difference: ", difference);
    }

    return;
  } catch (error) {
    console.log(
      `Startup - updateUsersBankAccounts for ${user.phoneNumber} error: ${JSON.stringify(error)}`,
    );

    return;
  }
}

module.exports = { updateUsersBankAccounts };
