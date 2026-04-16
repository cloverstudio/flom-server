const { logger } = require("#infra");
const { countries } = require("#config");
const { WhatsAppPrice } = require("#models");

const definition = `Market,Currency,Marketing,Utility,Authentication,"Authentication-\nInternational",Service`;
const NorthAmerica = "Canada,United States";
const Africa =
  "Algeria,Angola,Benin,Botswana,Burkina Faso,Burundi,Cameroon,Chad,Republic of the Congo,Eritrea,Ethiopia,Gabon,Gambia,Ghana,Guinea-Bissau,Ivory Coast,Kenya,Lesotho,Liberia,Libya,Madagascar,Malawi,Mali,Mauritania,Morocco,Mozambique,Namibia,Niger,Rwanda,Senegal,Sierra Leone,Somalia,South Sudan,Sudan,Swaziland,Tanzania,Togo,Tunisia,Uganda,Zambia,Zimbabwe";
const AsiaPacific =
  "Afghanistan,Australia,Bangladesh,Cambodia,China,Hong Kong,Japan,Laos,Mongolia,Nepal,New Zealand,Papua New Guinea,Philippines,Singapore,Sri Lanka,Taiwan,Tajikistan,Thailand,Turkmenistan,Uzbekistan,Vietnam";
const CentralAndEasternEurope =
  "Albania,Armenia,Azerbaijan,Belarus,Bulgaria,Croatia,Czech Republic,Georgia,Greece,Hungary,Latvia,Lithuania,Moldova,North Macedonia,Poland,Romania,Serbia,Slovakia,Slovenia,Ukraine";
const WesternEurope = "Austria,Belgium,Denmark,Finland,Ireland,Norway,Portugal,Sweden,Switzerland";
const LatinAmerica =
  "Bolivia,Costa Rica,Dominican Republic,Ecuador,El Salvador,Guatemala,Haiti,Honduras,Jamaica,Nicaragua,Panama,Paraguay,Puerto Rico,Uruguay,Venezuela";
const MiddleEast = "Bahrain,Iraq,Jordan,Kuwait,Lebanon,Oman,Qatar,Yemen";

async function updateWhatsAppPrices(csv) {
  try {
    const formatted = [];
    const arr = csv.split("\r\n");

    let startFound = false;
    for (let el of arr) {
      el = el.trim();

      if (el.includes("Market,Currency,Marketing,Utility")) {
        startFound = true;
        if (el !== definition) {
          logger.error("updateWhatsAppPrices, definition does not match");
          break;
        }

        continue;
      }

      if (!startFound) {
        continue;
      }

      if (startFound && el !== "") {
        let elArr = el.split(",");
        if (elArr.length !== 7) {
          logger.error("updateWhatsAppPrices, row does not match definition length:", el);
        } else {
          let [
            market,
            currency,
            marketing,
            utility,
            authentication,
            authenticationInternational,
            service,
          ] = elArr;

          let waCountries = null;

          switch (market) {
            case "Other":
              waCountries = ["Other"];
              break;
            case "North America":
              waCountries = NorthAmerica.split(",");
              break;
            case "Rest of Africa":
              waCountries = Africa.split(",");
              break;
            case "Rest of Asia Pacific":
              waCountries = AsiaPacific.split(",");
              break;
            case "Rest of Central & Eastern Europe":
              waCountries = CentralAndEasternEurope.split(",");
              break;
            case "Rest of Western Europe":
              waCountries = WesternEurope.split(",");
              break;
            case "Rest of Latin America":
              waCountries = LatinAmerica.split(",");
              break;
            case "Rest of Middle East":
              waCountries = MiddleEast.split(",");
              break;
            default:
              waCountries = [market];
          }

          for (const country of waCountries) {
            const countryCode =
              country === "Other"
                ? "default"
                : Object.keys(countries).find((key) => countries[key].name === country);

            if (!countryCode) {
              logger.error(`updateWhatsAppPrices, country code not found for country: ${country}`);
              continue;
            }

            formatted.push({
              country,
              countryCode,
              currency,
              marketing: +marketing,
              utility: +utility,
            });
          }
        }
      }
    }

    const bulkArr = formatted.map((item) => {
      const { countryCode, ...rest } = item;
      return { updateOne: { filter: { countryCode }, update: { ...rest }, upsert: true } };
    });

    await WhatsAppPrice.bulkWrite(bulkArr);

    return { error: false };
  } catch (error) {
    logger.error("Error parsing WhatsApp prices:", error);
    return { error: true, message: "Failed to parse WhatsApp prices" };
  }
}

module.exports = updateWhatsAppPrices;
