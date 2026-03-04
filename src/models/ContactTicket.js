const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phoneNumber: String,
    firstName: String,
    lastName: String,
    message: String,
    email: String,
    businessName: String,
    zipCode: String,
    website: String,
    industry: String,
    revenue: String,
    status: { type: Number, default: Const.contactTicketStatusSubmitted },
    created: { type: Number, default: Date.now },
    modified: { type: Number, default: Date.now },
  },
  { timestamps: true },
);

module.exports = db.db1.model("ContactTicket", schema, "contact_tickets");
