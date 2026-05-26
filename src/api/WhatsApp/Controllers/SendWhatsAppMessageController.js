"use strict";

const router = require("express").Router();
const { logger } = require("#infra");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const Logics = require("#logics");
const { User } = require("#models");

router.post("/", async function (request, response) {
  try {
    const secretToken = request.headers["secret-token"];
    if (secretToken !== Config.secretToken) {
      return response.status(401).send("Unauthorized");
    }

    const {
      message,
      senderId,
      receiverIds,
      template,
      userName,
      liveStreamId,
      auctionName,
      auctionId,
      shippingStatus,
      orderId,
      orderName,
      slug,
    } = request.body;

    if (!receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return response.status(400).send("Invalid receiverIds");
    }

    if (!template || !Const.templateMap[template]) {
      return response.status(400).send("Invalid template");
    }

    const sender = await User.findById(senderId).lean();
    const receivers = await User.find({ _id: { $in: receiverIds } }).lean();

    if (!receivers || receivers.length === 0) {
      return response.status(404).send("Receiver users not found");
    }

    const wamIds = await Logics.sendWhatsAppMessages({
      sender,
      receivers,
      message,
      template,
      userName,
      liveStreamId,
      auctionName,
      auctionId,
      shippingStatus,
      orderId,
      orderName,
      slug,
    });

    if (!wamIds || wamIds.length === 0) {
      return response.status(500).send("No messages sent");
    }

    return response.sendStatus(200);
  } catch (error) {
    return response.status(500).send("Internal Server Error: " + error.message);
  }
});

module.exports = router;
