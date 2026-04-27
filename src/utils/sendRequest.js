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
  returnHeaders = false,
  returnErrorAsData = false,
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

    if (returnHeaders) {
      return { data: resp.data, headers: resp.headers };
    }

    return resp.data;
  } catch (error) {
    if (!error.response) {
      const errorMessage = !error.stack
        ? `send request error: ${error.message}`
        : `send request error: ${error.stack}`;
      if (returnErrorAsData) {
        return { error: errorMessage };
      }
      throw new Error(errorMessage);
    }

    const {
      response: { status, statusText, data },
    } = error;

    const errorObj = { method, url, headers, body, status, statusText, data };
    const errorMessage = `send request error: ${JSON.stringify(errorObj)}`;
    if (returnErrorAsData) {
      return { error: errorMessage };
    }
    throw new Error(errorMessage);
  }
}

module.exports = sendRequest;
