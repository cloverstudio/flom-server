const { db, logger } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");
const User = require("./User");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, index: true },
    localID: { type: String, index: true },
    userID: { type: String, index: true },
    roomID: { type: String, index: true },
    type: Number,
    message: String,
    image: String,
    remoteIpAddress: String,
    file: {
      file: {
        id: mongoose.Schema.Types.ObjectId,
        name: String,
        size: Number,
        mimeType: String,
        duration: Number,
      },
      thumb: { id: mongoose.Schema.Types.ObjectId, name: String, size: Number, mimeType: String },
    },
    seenBy: [],
    location: { lat: Number, lng: Number },
    deleted: Number,
    created: Number,
    receiverPhoneNumber: String,
    receiverName: String,
    senderPhoneNumber: String,
    senderName: String,
    attributes: {},
    deliveredTo: [{ userId: String, at: Number, _id: false }],
    sentTo: [String], // user ids
    isAdminMessage: { type: Boolean, default: false },
  },
  { timestamps: true },
);

schema.index({ "attributes.auctionInfo._id": 1 });

schema.statics.findOldMessages = async function (roomID, lastMessageID, limit) {
  try {
    const query = { roomID: roomID };
    if (lastMessageID != 0) {
      const message = await this.findById(lastMessageID).lean();
      const lastCreated = message.created;
      query.created = { $lt: lastCreated };
    }

    const messages = await this.find(query).sort({ created: -1 }).limit(limit).lean();

    return messages;
  } catch (error) {
    return console.error(new Date().toISOString(), error);
  }
};

schema.statics.findNewMessages = async function (roomID, lastMessageID, limit) {
  try {
    const query = { roomID: roomID };
    let sortOrder = "desc";

    if (lastMessageID != 0) {
      const message = await this.findById(lastMessageID).lean();
      const lastCreated = message.created;
      query.created = { $gt: lastCreated };
      sortOrder = "asc";
    }

    const messages = await this.find(query).sort({ created: sortOrder }).limit(limit).lean();

    if (lastMessageID == 0) {
      messages.sort((a, b) => a.created - b.created);
    }

    return messages;
  } catch (error) {
    return console.error(new Date().toISOString(), error);
  }
};

schema.statics.findNewMessagesCurrentInc = async function (roomID, lastMessageID, limit) {
  try {
    const query = { roomID: roomID };
    let sortOrder = "desc";

    if (lastMessageID != 0) {
      const message = await this.findById(lastMessageID).lean();
      const lastCreated = message.created;
      query.created = { $gte: lastCreated };
      sortOrder = "asc";
    }

    const messages = await this.find(query).sort({ created: sortOrder }).limit(limit).lean();

    if (lastMessageID == 0) {
      messages.sort((a, b) => a.created - b.created);
    }

    return messages;
  } catch (error) {
    return console.error(new Date().toISOString(), error);
  }
};

schema.statics.findAllMessages = async function (roomID, fromMessageID) {
  try {
    const query = { roomID: roomID };
    let sortOrder = "desc";

    if (fromMessageID != 0) {
      const message = await this.findById(fromMessageID).lean();
      const lastCreated = message.created;
      query.created = { $gte: lastCreated };
      sortOrder = "asc";
    }

    let messages = await this.find(query).sort({ created: sortOrder }).lean();

    if (fromMessageID != 0 && messages.length < Const.pagingLimit) {
      messages = await this.findNewMessages(roomID, 0, Const.pagingLimit);
    }
    if (fromMessageID == 0) {
      messages.sort((a, b) => a.created - b.created);
    }

    return messages;
  } catch (error) {
    return console.error(new Date().toISOString(), error);
  }
};

schema.statics.populateMessages = async function (messages) {
  try {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    // collect ids
    let ids = [];
    let oldIds = [];
    const newIds = []; // only user from

    messages.forEach(function (row) {
      // get users for seeny too
      row.seenBy.forEach(function (row2) {
        if (row2.version == 2) {
          ids.push(row2.user);
        } else {
          if (mongoose.isValidObjectId(row2.user)) oldIds.push(row2.user.toString());
          else oldIds.push(row2.userID);
        }
      });

      ids.push(row.userID);
      newIds.push(row.userID);
    });

    oldIds = Array.from(new Set(oldIds));

    if (ids.length == 0 && oldIds.length == 0) {
      return messages;
    }

    if (oldIds.length == 0) {
      return [];
    }

    messages = await this.find({ user: { $in: oldIds } })
      .sort({ created: -1 })
      .limit(500)
      .lean();

    const convTable = {};
    messages.forEach((messageObj) => {
      ids.push(messageObj.userID.toString());
      convTable[messageObj.user] = messageObj.userID.toString();
    });

    ids = Array.from(new Set(ids));

    messages.forEach(function (row) {
      row.seenBy = row.seenBy.map((obj) => {
        const newUserId = convTable[obj.user.toString()];
        if (!newUserId) {
          return obj;
        } else {
          return { user: newUserId.toString(), at: obj.at, version: 2 };
        }
      });

      // update to new seenby
      this.findByIdAndUpdate(row._id.toString(), { seenBy: row.seenBy });
    });

    const resultAry = [];

    const users = await User.find({ _id: { $in: newIds } }, User.getDefaultResponseFields()).lean();
    messages.forEach(function (messageElement) {
      users.forEach(function (userElement) {
        if (!messageElement || !messageElement.userID || !userElement || !userElement._id) return;

        // replace user to userObj
        if (messageElement.userID.toString() == userElement._id.toString()) {
          messageElement.user = userElement;
        }
      });

      resultAry.push(messageElement);
    });

    return resultAry;
  } catch (error) {
    logger.error("Error in populateMessages: ", error);
    return [];
  }
};

module.exports = db.db1.model("FlomMessage", schema, "flom_messages");
