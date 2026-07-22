"use strict";

const { logger } = require("#infra");
const Base = require("../api/Base");
const { Const } = require("#config");
const { IdempotencyRecord } = require("#models");
const crypto = require("crypto");

function hashBody(body) {
  return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

async function idempotency(req, res, next) {
  const key = req.header("Idempotency-Key");

  if (!key) {
    return Base.newErrorResponse({
      response: res,
      code: Const.responsecodeIdempotencyKeyRequired,
      message: "Idempotency-Key header is required",
    });
  }

  const route = `${req.method} ${req.originalUrl}`;
  const requestHash = hashBody(req.body);

  let record;
  try {
    // Try to insert a "processing" placeholder. Unique index does the race-condition work.
    record = await IdempotencyRecord.create({
      key,
      //userId: req.user._id.toString(),
      route,
      requestHash,
      status: "processing",
    });
  } catch (err) {
    if (err.code === 11000) {
      // Key already exists — fetch it
      const existing = (
        await IdempotencyRecord.find({
          //userId: req.user._id.toString(),
          key,
          route,
        })
          .sort({ created: -1 })
          .limit(1)
      )[0];

      if (!existing) return next(); // rare TTL-race edge case, just proceed

      if (existing.created < Date.now() - 48 * 60 * 60 * 1000) {
        return next();
      }

      if (existing.requestHash !== requestHash) {
        return Base.newErrorResponse({
          response: res,
          code: Const.responsecodeIdempotencyKeyMismatch,
          message: "Idempotency-Key was already used with a different request body",
        });
      }

      if (existing.status === "processing") {
        return Base.newErrorResponse({
          response: res,
          code: Const.responsecodeOriginalRequestStillProcessing,
          message: "Original request with this Idempotency-Key is still processing",
        });
      }

      if (existing.statusCode != 200) {
        return next();
      }

      // Completed — replay the stored result
      return res.status(existing.statusCode).json(existing.responseBody);
    }
    return next(err);
  }

  // Capture the response so we can store it once the controller finishes
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    IdempotencyRecord.updateOne(
      { _id: record._id },
      { status: "completed", statusCode: res.statusCode, responseBody: body },
    ).catch((err) => console.error("Failed to save idempotency result:", err));

    return originalJson(body);
  };

  next();
}

module.exports = idempotency;
