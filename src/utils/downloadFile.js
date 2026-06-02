const axios = require("axios");
const fs = require("fs");

async function downloadFile({ url, outputPath, headers = {} }) {
  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
      headers,
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve); // ← correct: "finish" on the writable
      writer.on("error", reject);
      response.data.on("error", reject); // also catch read-side errors
    });

    return { success: true };
  } catch (error) {
    console.error("Error downloading file:", error);

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    return { error: error.message };
  }
}

module.exports = downloadFile;
