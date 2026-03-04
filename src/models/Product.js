const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    name: String,
    parentCategoryId: String,
    categoryId: mongoose.Schema.Types.ObjectId,
    description: String,
    originalPrice: {
      countryCode: String,
      currency: String,
      value: { type: Number, default: -1 },
      minValue: { type: Number, default: -1 },
      maxValue: { type: Number, default: -1 },
      singleValue: { type: Number, default: -1 },
      unlimitedValue: { type: Number, default: -1 },
      exclusiveValue: { type: Number, default: -1 },
    },
    priceType: Number, // 1 - fixed, 2 - range, 3 - bid
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
    countryCode: String,
    file: [
      {
        file: {
          id: mongoose.Schema.Types.ObjectId,
          originalName: String,
          nameOnServer: String,
          hslName: String,
          size: Number,
          mimeType: String,
          duration: Number,
          aspectRatio: Number,
          width: Number,
          height: Number,
        },
        thumb: {
          id: mongoose.Schema.Types.ObjectId,
          originalName: String,
          nameOnServer: String,
          size: Number,
          mimeType: String,
        },
        order: Number,
        fileType: Number, // 0 - image, 1 - video, 2 - audio
        webm_av1_sd: {
          originalName: String,
          nameOnServer: String,
          dashName: String,
          size: Number,
          mimeType: String,
          duration: Number,
          aspectRatio: Number,
          width: Number,
          height: Number,
        },
      },
    ],
    image: [
      {
        picture: {
          originalName: String,
          size: Number,
          mimeType: String,
          nameOnServer: String,
        },
        thumbnail: {
          originalName: String,
          size: Number,
          mimeType: String,
          nameOnServer: String,
        },
      },
    ],
    rate: Number,
    isDeleted: { type: Boolean, default: false },
    numberOfReviews: { type: Number, default: 0 },
    status: Number, // 1: Enabled, 0: Disabled
    ownerId: String,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      country: String,
      countryCode: String,
      city: String,
      road: String,
      houseNumber: String,
      postCode: String,
      displayName: String,
    },
    isNegotiable: Boolean,
    itemCount: Number,
    numberOfViews: { type: Number, default: 0 },
    brandId: String,
    colorId: String,
    genderId: String,
    sizeId: String,
    condition: String,
    priceRange: Boolean,
    productMainCategoryId: String,
    productSubCategoryId: String,
    productTypeId: String,
    productMakeId: String,
    productModelId: String,
    subTypeId: String,
    showYear: Boolean,
    vehicleYear: Number,
    year: Number,
    numberOfLikes: { type: Number, default: 0 },
    moderation: {
      status: { type: Number, default: Const.moderationStatusPending }, // 1 - pending, 2 - rejected, 3 - approved
      comment: String,
    },
    type: { type: Number }, // 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product
    tags: String,
    hashtags: [String],
    appropriateForKids: { type: Boolean, default: false },
    privateVideo: Boolean,
    bid: {
      startingPrice: Number,
      firstBidValue: Number,
      secondBidValue: Number,
      startTime: Number,
      endTime: Number,
      duration: Number,
    },
    visibility: { type: String, default: Const.defaultProductVisibility },
    tribeIds: [String],
    communityIds: [String],
    featured: {
      created: { type: Number, default: Date.now },
      isFeatured: { type: Boolean, default: 0 },
      countryCode: { type: String, default: "default" },
    },
    videoURL: String,
    linkedProductId: String,
    allowPublicComments: { type: Boolean, default: false },
    availableForExpo: { type: Boolean, default: false },
    isFree: Boolean,
    usedInExpoCount: { type: Number, default: 0 },
    audioForExpoInfo: {
      audioId: String,
      name: String,
      created: Number,
      nameOnServer: String,
      ownerId: String,
      ownerUserName: String,
      ownerPhoneNumber: String,
      audioType: String,
    },
    audiosForExpo: [
      {
        _id: false,
        audioId: String,
        name: String,
        created: Number,
        nameOnServer: String,
        ownerId: String,
        ownerUserName: String,
        ownerPhoneNumber: String,
        audioType: String,
      },
    ],
    contentPurchaseHistory: [
      {
        date: Number,
        transferId: String,
        buyerId: String,
        buyerPhoneNumber: String,
        purchaseType: String,
      },
    ],
    mediaProcessingInfo: { status: String, error: String }, // status: processing, completed, failed
    engagementBonus: {
      allowed: Boolean,
      allowEngagementBonus: Boolean,
      budgetCredits: Number,
      engagementBudgetCredits: Number,
      creditsPerLinkedExpo: Number,
    },
    language: String,
    reservations: [{ auctionId: String, quantity: Number }],
  },
  { timestamps: true },
);

schema.index({ location: "2dsphere" });

schema.index({ name: "text", description: "text" });

schema.index({ ownerId: 1 });

schema.index({ created: -1 });

schema.index({ hashtags: -1 });

schema.index({ featured: -1 });

schema.index({ _id: -1, isDeleted: -1 });

schema.post(/find/, function (docs) {
  const arr = !Array.isArray(docs) ? [docs] : docs;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].reservations && arr[i].reservations.length > 0) {
      let totalReserved = 0;
      for (const reservation of arr[i].reservations) {
        totalReserved += reservation.quantity;
      }
      arr[i].itemCount = arr[i].itemCount - totalReserved;
    }
  }
});

module.exports = db.db1.model("Product", schema, "products");
