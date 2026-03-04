const recombee = require("recombee-api-client");
const { Config } = require("#config");

const dbId = Config.recombee.dbId;
const privateToken = Config.recombee.privateToken;
const region = Config.recombee.region;

/**
 * @type {recombee.ApiClient}
 */
let client = null;

/**
 * @type {recombee.requests}
 */
let rqs = null;

function getClientAndRequest() {
  if (!client) client = new recombee.ApiClient(dbId, privateToken, { region });
  if (!rqs) rqs = recombee.requests;

  return { client, rqs };
}

module.exports = Object.freeze({ getClientAndRequest });
