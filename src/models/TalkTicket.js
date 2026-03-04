const { db } = require("#infra");
const mongoose = require("mongoose");
const { Const } = require("#config");

/**
 * @type {mongoose.SchemaDefinitionProperty}
 */

const schema = new mongoose.Schema(
  {
    phonenumber: String,
    firstname: String,
    lastname: String,
    companyname: String,
    companywebsite: String,
    tellusmore: String,
    businessemail: String,
    jobtitle: String,
    help: String,
    country: String,
    status: { type: Number, default: Const.talkTicketStatusSubmitted },
    created: { type: Number, default: Date.now },
    modified: Number,
  },
  { timestamps: true },
);

module.exports = db.db1.model("TalkTicket", schema, "talk_tickets");
