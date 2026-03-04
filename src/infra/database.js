const mongoose = require("mongoose");
const logger = require("./logger");
const { Config } = require("#config");

class Database {
  constructor() {
    this.db1 = null;
    this.db2 = null;
  }

  async init() {
    this.db1 = await mongoose.createConnection(Config.databaseUrl).asPromise();
    this.db2 = await mongoose.createConnection(Config.newFlomDatabaseUrl).asPromise();

    try {
      this.db1 = await mongoose.createConnection(Config.databaseUrl).asPromise();
      logger.notice("Flom v1 database connected!");
    } catch (error) {
      logger.error("Flom v1 database connection failed!", error);
      throw error;
    }

    try {
      this.db2 = await mongoose.createConnection(Config.newFlomDatabaseUrl).asPromise();
      logger.notice("Flom v2 database connected!");
    } catch (error) {
      logger.error("Flom v2 database connection failed!", error);
      throw error;
    }
  }
}

const db = new Database();
module.exports = db;
