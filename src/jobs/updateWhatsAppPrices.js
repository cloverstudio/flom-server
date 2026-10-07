const { logger } = require("#infra");
const { countries, Config } = require("#config");
const Utils = require("#utils");
const { Configuration, WhatsAppPrice } = require("#models");
const XLSX = require("xlsx");

const whatsAppPricingUrl =
  "https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing";
const definition = `Market,Currency,Marketing,Utility,Authentication,"Authentication-\nInternational",Service`;
const NorthAmerica = "Canada,United States";
const Africa =
  "Algeria,Angola,Benin,Botswana,Burkina Faso,Burundi,Cameroon,Chad,Republic of the Congo,Eritrea,Ethiopia,Gabon,Gambia,Ghana,Guinea-Bissau,Ivory Coast,Kenya,Lesotho,Liberia,Libya,Madagascar,Malawi,Mali,Mauritania,Mozambique,Namibia,Niger,Rwanda,Senegal,Sierra Leone,Somalia,South Sudan,Sudan,Swaziland,Tanzania,Togo,Tunisia,Uganda,Zambia,Zimbabwe";
const AsiaPacific =
  "Afghanistan,Australia,Cambodia,China,Japan,Laos,Mongolia,New Zealand,Papua New Guinea,Philippines,Singapore,Taiwan,Tajikistan,Thailand,Turkmenistan,Uzbekistan,Vietnam";
const CentralAndEasternEurope =
  "Albania,Armenia,Azerbaijan,Belarus,Bulgaria,Croatia,Czech Republic,Georgia,Greece,Latvia,Lithuania,Moldova,North Macedonia,Serbia,Slovakia,Slovenia";
const WesternEurope = "Austria,Belgium,Denmark,Finland,Ireland,Norway,Portugal,Sweden,Switzerland";
const LatinAmerica =
  "Bolivia,Costa Rica,Dominican Republic,Ecuador,El Salvador,Guatemala,Haiti,Honduras,Jamaica,Nicaragua,Panama,Paraguay,Puerto Rico,Uruguay,Venezuela";
const MiddleEast = "Bahrain,Jordan,Lebanon,Yemen";

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

    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      const err = new Error(`HTTP error! status: ${response.status}`);
      logger.error("updateWhatsAppPrices, error fetching CSV:", err);

      Utils.sendEmailWithSG({
        subject: "Whatsapp CSV request issue!",
        text: `There was an issue requesting the WhatsApp prices CSV (${Config.environment}). Error details: ${err}`,
        to: "petar.biocic@pontistechnology.com",
      });

      return;
    }

    const lastModified = response.headers ? response.headers.get("last-modified") : 0;
    if (lastModified && new Date(lastModified).getTime() <= lastUpdate) {
      logger.info("updateWhatsAppPrices, CSV not updated since last check");
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const formattedPrices = await parsePrices(buffer);

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
    const response = await fetch(whatsAppPricingUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const data = await response.text();

    const jms = `"json_cms_content":"`; // include the opening quote
    const startIndex = data.indexOf(jms);
    if (startIndex === -1) {
      throw new Error("json_cms_content not found in page");
    }
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

    const node = findNode(parsed);

    function findNode(node, parent) {
      if (typeof node === "string") {
        if (node.trim() === "USD list rates") {
          return parent;
        }
      }
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, node);
          if (found) return found;
        }
      }
      return null;
    }

    const ratesUrl = node.props?.href;

    return { url: ratesUrl };
  } catch (error) {
    logger.error("fetchPricesCsvUrl error:", error);
    return { error: error.message };
  }
}

async function parsePrices(buffer) {
  try {
    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    const formatted = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(sheet);

      if (sheetName !== "List rates") continue;

      for (const r of rows) {
        if (!r.__EMPTY || r.__EMPTY === "Currency") continue;

        const market =
          r["Cost per message in USD on the WhatsApp Business Platform, effective October 1, 2026"];
        const currency = r.__EMPTY;
        const marketing = r.__EMPTY_1 === "n/a" ? null : r.__EMPTY_1;
        const utility = r.__EMPTY_2 === "n/a" ? null : r.__EMPTY_2;
        const authentication = r.__EMPTY_3 === "n/a" ? null : r.__EMPTY_3;
        const authenticationInternational = r.__EMPTY_4 === "n/a" ? null : r.__EMPTY_4;
        const service = r.__EMPTY_5 === "n/a" ? null : r.__EMPTY_5;
        const metaBusinessAgent =
          r.__EMPTY_6 === "n/a"
            ? null
            : +r.__EMPTY_6.replace(" USD / 1 M (million) tokens", "").replace("$", "").trim();

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
            logger.error(`parsePrices, country code not found for country: ${country}`);
            continue;
          }

          formatted.push({
            country,
            countryCode,
            currency,
            marketing,
            utility,
            authentication,
            authenticationInternational,
            service,
            metaBusinessAgent,
          });
        }
      }
    }

    return formatted;
  } catch (error) {
    logger.error("parsePrices error:", error);
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
              authentication: +authentication,
              authenticationInternational: +authenticationInternational,
              service: +service,
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
