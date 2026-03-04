const { Config } = require("#config");
const Utils = require("#utils");

const getMerchantsPhoneNumber = async (merchantCode) => {
  try {
    const options = {
      method: "GET",
      url: Config.getMerchantPhoneNumberUrl + merchantCode,
      auth: {
        username: "flom2",
        password: "Fl@1_pab",
      },
      timeout: 3000,
    };

    const apiResponse = await Utils.sendRequest(options);

    return `+${apiResponse.terminalMsisdn}`;
  } catch (error) {
    console.error("getMerchantsPhoneNumber Err", error.message);
    return null;
  }
};

module.exports = getMerchantsPhoneNumber;

//https://mcash:8443/backoffice/rest/merchant/findByTerminalShortcode/89440477
