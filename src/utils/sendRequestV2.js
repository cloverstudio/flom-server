const { logger } = require("#infra");
const qs = require("qs");
const fs = require("fs/promises");
const path = require("path");

async function sendRequestV2({
  method = "POST",
  url,
  query,
  headers,
  body,
  filePaths = [],
  timeout = 0,
}) {
  try {
    const urlWithQuery = query ? url + "?" + qs.stringify(query) : url;

    if (["POST", "PATCH", "PUT"].includes(method.toUpperCase())) {
      const contentType = headers?.["Content-Type"] || headers?.["content-type"];

      if (contentType && contentType.includes("application/json") && typeof body === "object") {
        body = JSON.stringify(body);
      } else if (
        contentType &&
        contentType.includes("application/x-www-form-urlencoded") &&
        typeof body === "object"
      ) {
        body = qs.stringify(body);
      } else if (
        contentType &&
        contentType.includes("multipart/form-data") &&
        typeof body === "object"
      ) {
        const formData = new FormData();
        for (const key in body) {
          formData.append(key, body[key]);
        }

        for (const filePath of filePaths) {
          const fileBuffer = await fs.readFile(filePath);
          const fileName = path.basename(filePath);

          formData.append("file", new Blob([fileBuffer]), fileName);
        }

        body = formData;
      } else if (body && typeof body !== "string") {
        body = String(body);
      } else if (!contentType && typeof body === "object") {
        body = JSON.stringify(body);
      } else {
        body = String(body);
      }
    }

    const options = {
      method: method.toUpperCase(),
      ...(timeout && { signal: AbortSignal.timeout(timeout) }),
      ...(headers && { headers }),
      ...(body && { body }),
    };

    const resp = await fetch(urlWithQuery, options);

    let data = null;
    const contentTypeResp = resp.headers.get("content-type");
    if (contentTypeResp && contentTypeResp.includes("application/json")) {
      data = await resp.json();
    } else {
      data = await resp.text();
    }

    const status = resp.status ? String(resp.status) : null;
    if (status && !status.startsWith("2")) {
      const errorData = data && typeof data === "object" ? JSON.stringify(data) : String(data);

      logger.error(`Request failed with status ${status}: ${errorData}`, {
        method,
        url,
        headers,
        body,
      });

      return { err: `Request failed with status ${status}: ${errorData}`, headers: resp.headers };
    }

    return { data, headers: resp.headers };
  } catch (error) {
    const errorMessage = !error.stack
      ? `Send request error: ${error.message}`
      : `Send request error: ${error.stack}`;

    logger.error(errorMessage, { method, url, headers, body });

    return { err: errorMessage };
  }
}

module.exports = sendRequestV2;
