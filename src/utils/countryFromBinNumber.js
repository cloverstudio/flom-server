const { Config } = require("#config");
const { BinLookup } = require("#models");
const sendRequest = require("./sendRequest");

async function countryFromBinNumber(binNumber) {
  try {
    const savedBinLookup = await BinLookup.findOne({ binNumber });

    if (savedBinLookup && now() - savedBinLookup.created < Config.binLookupCacheLifetime) {
      return savedBinLookup.countryCode;
    }

    const countryCode = await lookupBinNumber(binNumber);

    if (savedBinLookup) {
      savedBinLookup.countryCode = countryCode;
      savedBinLookup.created = now();
      await savedBinLookup.save();
    } else {
      await BinLookup.create({ binNumber, countryCode });
    }
    return countryCode;
  } catch (error) {
    if (error.code === 429) {
      console.error("Speed limit reached!", error);
    } else {
      console.error("Error when getting countryCode from credit card. ", error);
    }
  }
}

async function lookupBinNumber(bin) {
  const res = await sendRequest({
    method: "POST",
    url: Config.binCheckerUrl + bin,
    headers: Config.binCheckerHeaders,
    body: {
      ip: "8.8.8.8",
      bin,
    },
  });

  if (!res?.success) {
    console.error("lookupBinNumber: " + JSON.stringify(res));
    throw new Error("res.success false");
  }

  if (!res?.BIN?.country?.alpha2) throw new Error("res.BIN.country.alpha2 not found");

  return res.BIN.country.alpha2;
}

module.exports = countryFromBinNumber;
