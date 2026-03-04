"use strict";

const { logger } = require("#infra");
const { ApiAccessLog } = require("#models");

async function logApiAccess(req, res, next) {
  try {
    await ApiAccessLog.create({
      api: req.originalUrl,
      body: req.body || {},
      headers: req.headers || {},
      created: Date.now(),
      createdReadable: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("LogAPIAccess", error);
  }

  next();
}

module.exports = logApiAccess;
