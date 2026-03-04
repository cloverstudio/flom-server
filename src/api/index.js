const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

function loadRoutes() {
  try {
    const contents = fs.readdirSync(__dirname, { withFileTypes: true });
    const folders = contents.filter((d) => d.isDirectory()).map((d) => d.name);

    for (const folder of folders) {
      const routeFilePath = path.join(__dirname, folder, "routes.js");
      const routes = require(routeFilePath);
      router.use(`/`, routes);
    }

    return router;
  } catch (error) {
    console.error("Error loading routes:", error);
    return router; // Return an empty router in case of error
  }
}

module.exports = loadRoutes;
