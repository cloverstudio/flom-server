const qs = require("qs");
const { default: axios } = require("axios");
//const https = require("https");

async function sendRequest({
  allow = true,
  method = "POST",
  url,
  query,
  headers,
  body,
  timeout = 0,
}) {
  try {
    const urlWithQuery = query ? url + "?" + qs.stringify(query) : url;
    const options = {
      method,
      timeout: timeout * 1000,
      headers,
      url: urlWithQuery,
      data: body,
    };

    if (!allow && url.includes("valuetopup")) {
      return { err: "Request to valuetopup is not allowed" };

      /* const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      options.httpsAgent = agent; */
    }

    const resp = await axios(options);

    return { data: resp.data, headers: resp.headers };
  } catch (error) {
    if (!error.response) {
      const errorMessage = !error.stack
        ? `send request error: ${error.message}`
        : `send request error: ${error.stack}`;

      return { err: errorMessage };
    }

    const {
      response: { status, statusText, data },
    } = error;

    const errorObj = { method, url, headers, body, status, statusText, data };
    const errorMessage = `send request error: ${JSON.stringify(errorObj)}`;

    return { err: errorMessage };
  }
}

module.exports = sendRequest;
