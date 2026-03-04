const amqplib = require("amqplib");
const { logger } = require("#infra");
const { Config } = require("#config");

let connection = null;
const channels = {};

const queues = ["bonus-queue"];

async function initConnection() {
  if (connection) {
    return connection;
  }

  const conn = await amqplib.connect(Config.rabbitMQUrl);
  logger.info("initConnection, Connected to RabbitMQ");

  conn.on("error", (err) => {
    logger.error(`initConnection, Connection error:`, err);
    connection = null;
  });
  conn.on("close", () => {
    logger.error(`initConnection, Connection closed`);
    connection = null;
  });

  connection = conn;
  return conn;
}

async function initChannel(queueName = null) {
  if (!queueName) {
    throw new Error("initChannel, queue name missing");
  }

  const connection = await initConnection();

  if (!channels[queueName]) {
    channels[queueName] = await connection.createChannel();
    channels[queueName].on("error", (err) => {
      logger.error(`initChannel, Channel ${queueName} error:`, err);
      channels[queueName] = null;
    });
    channels[queueName].on("close", () => {
      logger.error(`initChannel, Channel ${queueName} closed`);
      channels[queueName] = null;
    });

    await channels[queueName].assertQueue(queueName, { durable: true });

    channels[queueName].prefetch(1);
  }
}

async function getQueue(queueName = "bonus-queue") {
  if (!queueName) {
    throw new Error("getQueue, queue name missing");
  }

  if (!queues.includes(queueName)) {
    throw new Error(`getQueue, queue name ${queueName} not in queue list`);
  }

  if (!connection || !channels[queueName]) {
    await initChannel(queueName);
  }

  return channels[queueName];
}

module.exports = getQueue;
