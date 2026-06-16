const { db, logger } = require("#infra");
const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema({
  uuid: String,
  phoneNumber: String,
  userId: String,
  channel: String,
  created: Number,
  deleted: Number,
  isDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

const CoreIdentity = db.db1.model("CoreIdentity", schema, "core_identities");

class ExtendedCoreIdentity extends CoreIdentity {
  static async createCoreIdentity({ phoneNumber, userId, channel, created }) {
    try {
      if (!phoneNumber || !userId || !channel || !created) {
        throw new Error(
          "Missing required fields (phoneNumber, userId, channel, created), fields sent: " +
            JSON.stringify({ phoneNumber, userId, channel, created }),
        );
      }

      let uuidIsUnique = false;
      let uuid;

      const existingIdentity = await this.findOne({ phoneNumber }).lean();
      if (existingIdentity) {
        uuid = existingIdentity.uuid;
      }

      if (!uuid) {
        do {
          uuid = crypto.randomUUID().toString();
          const existingUuidIdentity = await this.findOne({ uuid }).lean();
          if (!existingUuidIdentity) {
            uuidIsUnique = true;
          }
        } while (!uuidIsUnique);
      }

      await this.updateMany({ phoneNumber, isActive: true }, { isActive: false });

      await this.create({
        uuid,
        phoneNumber,
        userId,
        channel,
        created,
        isActive: true,
      });

      return;
    } catch (error) {
      logger.error("Error creating core identity", error);
    }
  }
  static async deleteCoreIdentity({ userId }) {
    try {
      if (!userId) {
        throw new Error("Missing required field userId");
      }

      await this.updateMany(
        { userId, isDeleted: false },
        { isDeleted: true, deleted: Date.now(), isActive: false },
      );

      return;
    } catch (error) {
      logger.error("Error deleting core identity", error);
    }
  }
}

module.exports = ExtendedCoreIdentity;
