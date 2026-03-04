const fs = require("fs-extra");
const executeCommand = require("./executeCommand");

async function getVideoScreenshots(destPath, thumbFileName, newFileName) {
  const input = destPath + newFileName + ".mp4";
  const output = destPath + thumbFileName + ".jpg";

  const command = `ffmpeg -ss 1 -i ${input} -frames:v 1 -q:v 15 ${output}`;

  console.log("getVideoScreenshots command: " + command);
  const res = await executeCommand({ command });
  if (!res) {
    console.log("Error while getting video screenshot");
    console.error("Error while getting video screenshot");
    throw new Error("Error while getting video screenshot");
  }

  const thumbSize = fs.statSync(output).size;
  const thumbMimeType = "image/jpeg";

  return {
    thumbSize,
    thumbMimeType,
  };
}

module.exports = getVideoScreenshots;
