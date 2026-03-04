const { db } = require("#infra");
const mongoose = require("mongoose");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    userId: String,
    streamId: String,
    name: String,
    type: { type: String },
    visibility: String,
    tribeIds: [String],
    communityIds: [String],
    linkedProductIds: [String],
    activeProductId: String,
    startTimeStamp: Number,
    endTimeStamp: Number,
    isActive: { type: Boolean, default: false },
    totalNumberOfViews: { type: Number, default: 0 },
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
    tags: String,
    tagIds: [String],
    linkedProductTags: String,
    linkedProductTagIds: [String],
    cohosts: [String],
    mutedCohosts: [String],
    activeCohosts: [{ userId: String, startTimeStamp: Number, endTimeStamp: Number, _id: false }],
    allowComments: { type: Boolean, default: false },
    allowSuperBless: { type: Boolean, default: false },
    allowSprayBless: { type: Boolean, default: false },
    numberOfLikes: { type: Number, default: 0 },
    comments: [
      {
        commentType: String,
        commentId: String,
        created: Number,
        text: String,
        sender: {
          _id: String,
          phoneNumber: String,
          userName: String,
          created: Number,
          avatar: {},
        },
        messageData: {},
        gifData: {},
        stickerData: {},
        superBlessData: {},
        sprayBlessData: {},
        isDeleted: { type: Boolean, default: false },
        _id: false,
      },
    ],
    viewerIds: [String],
    additionalCameras: [{ _id: false, streamId: String }],
    additionalCohostCameras: [{ _id: false, streamId: String, cohostId: String }],
    domain: String,
    appropriateForKids: { type: Boolean, default: false },
    language: { type: String, default: "en" },
  },
  { timestamps: true },
);

module.exports = db.db1.model("LiveStream", schema, "live_streams");
