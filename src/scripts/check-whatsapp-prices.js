const { logger } = require("#infra");
const Utils = require("#utils");
const { Configuration } = require("#models");
const Logics = require("#logics");

async function checkWhatsAppPrices() {
  try {
    const csvUrl = (await Configuration.findOne({ type: "whatsapp", name: "csv-url" })).valueText;
    const lastUpdate =
      (await Configuration.findOne({ type: "whatsapp", name: "csv-url-updated" })).value || 0;

    if (!csvUrl) {
      logger.error("checkWhatsAppPrices, csvUrl not found in configuration");

      Utils.sendEmailWithSG({
        subject: "Whatsapp CSV issue!",
        text: `csvUrl not found in configuration`,
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
      logger.error("checkWhatsAppPrices, error fetching CSV:", csv.error);

      Utils.sendEmailWithSG({
        subject: "Whatsapp CSV request issue!",
        text: `There was an issue requesting the WhatsApp prices CSV. Error details: ${csv.error}`,
        to: "petar.biocic@pontistechnology.com",
      });

      return;
    }

    const lastModified = csv.headers ? csv.headers["last-modified"] : 0;

    if (lastModified && new Date(lastModified).getTime() < lastUpdate) {
      return;
    }

    await Logics.updateWhatsAppPrices(csv.data);

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

setTimeout(checkWhatsAppPrices, 1000 * 60 * 60 * 24);
