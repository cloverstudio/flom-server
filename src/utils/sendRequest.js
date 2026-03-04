const qs = require("qs");
const { default: axios } = require("axios");
const https = require("https");

async function sendRequest({
  allow = true,
  method = "POST",
  url,
  query,
  headers,
  body,
  responseType = "json",
  timeout = 0,
  resolveWithFullResponse = false,
  auth = undefined, // { username: "username", passowrd: "password" }
}) {
  try {
    const urlWithQuery = query ? url + "?" + qs.stringify(query) : url;
    const options = {
      method,
      timeout: timeout * 1000,
      responseType,
      headers,
      url: urlWithQuery,
      data: body,
      auth,
    };

    if (!allow && url.includes("valuetopup")) {
      return null;

      /* const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      options.httpsAgent = agent; */
    }

    const resp = await axios(options);

    if (resolveWithFullResponse) {
      return resp;
    }

    return resp.data;
  } catch (error) {
    if (!error.response) {
      const errorMessage = `send request error: ${error.stack}`;
      throw new Error(errorMessage);
    }

    const {
      response: { status, statusText, data },
    } = error;

    const errorObj = { method, url, headers, body, status, statusText, data };
    const errorMessage = `send request error: ${JSON.stringify(errorObj)}`;
    throw new Error(errorMessage);
  }
}

module.exports = sendRequest;
