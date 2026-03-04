"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const amqplib = require("amqplib");
const { Config } = require("#config");
const { logger, db } = require("#infra");
const queues = ["bonus-queue"];
let connection;
const channelState = {};

let Utils, consumerLogic;

const blankQueues = () => {
  for (const queue of queues) {
    channelState[queue] = "awaiting_setup";
  }
};

async function startConsumer() {
  try {
    logger.info(`startConsumer, Connecting to RabbitMQ...`);

    connection = connection ?? (await amqplib.connect(Config.rabbitMQUrl));

    await db.init();
    Utils = require("#utils");
    consumerLogic = require("./consumers");

    for (const queue of queues) {
      await setupQueue(queue, true);
    }

    connection.on("error", async (err) => {
      logger.error(`startConsumer, RabbitMQ connection error, reconnect in 3 seconds`, err);
      logger.error(JSON.stringify(err));
      connection = null;
      blankQueues();
      await Utils.wait(3);
      startConsumer();
    });

    connection.on("close", async () => {
      logger.error(`startConsumer, RabbitMQ connection closed, reconnect in 3 seconds.`);
      connection = null;
      blankQueues();
      await Utils.wait(3);
      startConsumer();
    });
  } catch (err) {
    logger.error(`startConsumer error, Reconnecting in 3 seconds...`);
    logger.error(JSON.stringify(err));
    connection = null;
    blankQueues();
    await Utils.wait(3);
    startConsumer();
  }
}

async function setupQueue(queue, isInitialSetup = false) {
  try {
    if (
      !isInitialSetup &&
      (channelState[queue] === "connected" ||
        channelState[queue] === "connecting" ||
        channelState[queue] === "awaiting_setup")
    ) {
      return;
    }

    channelState[queue] = "connecting";
    const channel = await connection.createChannel();
    channelState[queue] = "connected";

    channel.on("error", async (err) => {
      logger.error(
        `setupQueue, Channel ${queue} error, recreating in 5 seconds if not connected...`,
      );
      logger.error(JSON.stringify(err));
      await Utils.wait(5);
      if (
        channelState[queue] === "connected" ||
        channelState[queue] === "connecting" ||
        channelState[queue] === "awaiting_setup"
      ) {
        return;
      }
      setupQueue(queue);
    });

    channel.on("close", async () => {
      logger.error(
        `setupQueue, Channel ${queue} closed, recreating in 5 seconds if not connected...`,
      );
      await Utils.wait(5);
      if (
        channelState[queue] === "connected" ||
        channelState[queue] === "connecting" ||
        channelState[queue] === "awaiting_setup"
      ) {
        return;
      }
      setupQueue(queue);
    });

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    channel.consume(
      queue,
      async (msg) => {
        channel.ack(msg);

        try {
          await consumerLogic[queue](msg);
        } catch (err) {
          logger.error(`setupQueue, Message processing error:`, err);
        }
      },
      { noAck: false },
    );
  } catch (error) {
    logger.error(`setupQueue, Error setting up consumer for queue ${queue}:`, error);
    await Utils.wait(5);
    if (
      channelState[queue] === "connected" ||
      channelState[queue] === "connecting" ||
      channelState[queue] === "awaiting_setup"
    ) {
      return;
    }
    setupQueue(queue);
  }
}

// Start the consumer
startConsumer().catch((error) => {
  logger.error(`Fatal error in consumer:`, error);
});
