"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Configuration } = require("#models");
const Logics = require("#logics");

router.post(
  "/url",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { url } = request.body;

      if (!url) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidParameter,
          message: "WA URL is required",
        });
      }

      const myUrl = new URL(url);
      const csvUrl = myUrl.searchParams.get("u");
      console.log("CSV URL: ", csvUrl);

      await Configuration.updateOne(
        { type: "whatsapp", name: "csv-url" },
        { valueText: csvUrl },
        { upsert: true },
      );

      const csv = await Utils.sendRequest({
        method: "GET",
        url: csvUrl,
        returnHeaders: true,
      });

      await Logics.updateWhatsAppPrices(csv.data);

      const lastModified = csv.headers ? csv.headers["last-modified"] : null;
      const lmDate = lastModified ? new Date(lastModified) : null;
      console.log("Last Modified: ", lastModified);
      console.log("Last Modified Date: ", lmDate ? lmDate.getTime() : null);

      await Configuration.updateOne(
        { type: "whatsapp", name: "csv-url-updated" },
        { value: lmDate ? lmDate.getTime() : null },
        { upsert: true },
      );

      Base.successResponse(response, Const.responsecodeSucceed, {
        csvUrl,
        lastModified: lmDate ? lmDate.getTime() : null,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "AdminWhatsAppController",
        error,
      });
    }
  },
);

module.exports = router;
