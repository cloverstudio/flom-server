const { logger } = require("#infra");
const { countries, Config } = require("#config");
const Utils = require("#utils");
const { Configuration, WhatsAppPrice } = require("#models");

const whatsAppPricingUrl =
  "https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing";
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

async function updateWhatsAppPrices() {
  try {
    const configuration = await Configuration.findOne({
      type: "whatsapp",
      name: "csv-url-updated",
    });
    const lastUpdate = configuration ? configuration.value : 0;

    const { url: csvUrl, error } = await fetchPricesCsvUrl();

    if (error) {
      logger.error("updateWhatsAppPrices, error fetching CSV URL:", error);

      Utils.sendEmailWithSG({
        subject: "Whatsapp CSV issue!",
        text: `There was an issue fetching CSV URL (${Config.environment}). Error details: ${error}`,
        to: "petar.biocic@pontistechnology.com",
      });

      return;
    }

    const csv = await Utils.sendRequest({
      method: "GET",
      url: csvUrl,
      returnHeaders: true,
      returnErrorAsData: true,
    });

    if (csv.error) {
      logger.error("updateWhatsAppPrices, error fetching CSV:", csv.error);

      Utils.sendEmailWithSG({
        subject: "Whatsapp CSV request issue!",
        text: `There was an issue requesting the WhatsApp prices CSV (${Config.environment}). Error details: ${csv.error}`,
        to: "petar.biocic@pontistechnology.com",
      });

      return;
    }

    const lastModified = csv.headers ? csv.headers["last-modified"] : 0;
    if (lastModified && new Date(lastModified).getTime() <= lastUpdate) {
      logger.info("updateWhatsAppPrices, CSV not updated since last check");
      return;
    }

    const { formatted: formattedPrices, error: parseError } = await parseCsv(csv.data);

    if (parseError) {
      logger.error("updateWhatsAppPrices, error parsing CSV:", parseError);

      Utils.sendEmailWithSG({
        subject: "Whatsapp CSV issue!",
        text: `There was an issue parsing the WhatsApp prices CSV (${Config.environment}). Error details: ${parseError}`,
        to: "petar.biocic@pontistechnology.com",
      });

      return;
    }

    if (!formattedPrices || formattedPrices.length === 0) {
      logger.error("updateWhatsAppPrices, no prices found in CSV");

      Utils.sendEmailWithSG({
        subject: "Whatsapp CSV issue!",
        text: `No prices were found in the WhatsApp prices CSV (${Config.environment}).`,
        to: "petar.biocic@pontistechnology.com",
      });

      return;
    }

    const bulkArr = formattedPrices.map((item) => {
      const { countryCode, ...rest } = item;
      return { updateOne: { filter: { countryCode }, update: { ...rest }, upsert: true } };
    });

    await WhatsAppPrice.bulkWrite(bulkArr);

    await Configuration.updateOne(
      { type: "whatsapp", name: "csv-url-updated" },
      { value: new Date(lastModified).getTime() },
      { upsert: true },
    );

    return;
  } catch (error) {
    logger.error("Error checking WhatsApp prices:", error);
  }
}

async function fetchPricesCsvUrl() {
  try {
    // Like the browser fetch API, the default method is GET
    const response = await fetch(whatsAppPricingUrl);
    const data = await response.text();

    const jms = `"json_cms_content":"`; // include the opening quote
    const startIndex = data.indexOf(jms);
    const valueStart = startIndex + jms.length; // now points inside the opening quote

    // Walk through chars, tracking escape sequences to find the closing quote
    let result = "";
    let i = valueStart;
    while (i < data.length) {
      const char = data[i];
      if (char === "\\") {
        // skip escaped character
        result += data[i + 1];
        i += 2;
      } else if (char === '"') {
        // closing quote reached
        break;
      } else {
        result += char;
        i++;
      }
    }

    const parsed = JSON.parse(result);
    const tables = parsed.children.filter((i) => i.type === "DMCCommonTable");
    let rates = tables.find(
      (t) => t.children[0]?.children[0]?.children[0]?.children[0] === `\nCurrency\n`,
    );
    rates = rates.children.find((t) => t.type === "DMCCommonTbody");
    rates = rates.children.find((r) => r.children[0]?.children[0] === `\nUSD\n`);
    rates = rates.children.find((c) => c?.children?.[0]?.children?.[0] === "USD rates");

    const ratesUrl = rates.children[0].props.href;

    return { url: ratesUrl };
  } catch (error) {
    logger.error("fetchPricesCsvUrl error:", error);
    return { error: error.message };
  }
}

async function parseCsv(csv) {
  try {
    const formatted = [];
    const arr = csv.split("\r\n");

    let startFound = false;
    for (let el of arr) {
      el = el.trim();

      if (el.includes("Market,Currency,Marketing,Utility")) {
        startFound = true;
        if (el !== definition) {
          logger.error("parseCsv, definition does not match");
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
          logger.error("parseCsv, row does not match definition length:", el);
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
              logger.error(`parseCsv, country code not found for country: ${country}`);
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

    return { formatted };
  } catch (error) {
    logger.error("Error parsing WhatsApp prices:", error);
    return { error: error.message };
  }
}

module.exports = updateWhatsAppPrices;
