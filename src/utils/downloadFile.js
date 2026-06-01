const axios = require("axios");
const fs = require("fs");

async function downloadFile({ url, outputPath }) {
  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });

    response.data.pipe(fs.createWriteStream(outputPath));

    await new Promise((resolve, reject) => {
      response.data.on("finish", resolve);
      response.data.on("error", reject);
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
