const fs = require("fs-extra");
const { Config } = require("#config");
const getRandomString = require("./getRandomString");
const executeCommand = require("./executeCommand");

async function rotateVideo(input, output, rotation) {
  let transpose;
  if (rotation !== 0) {
    switch (rotation) {
      case "90":
        transpose = "transpose=1";
        break;
      case "180":
        transpose = "transpose=2,transpose=2";
        break;
      case "270":
        transpose = "transpose=2";
        break;
      default:
        throw new Error("can't rotate the video");
    }
  } else {
    throw new Error("can't rotate the video");
  }
  const tempFile = Config.uploadPath + "/" + getRandomString(28) + ".mp4";

  const command1 = `ffmpeg -i ${input} -c copy -metadata:s:v:0 rotate=0 ${tempFile}`;
  const command2 = `ffmpeg -i ${tempFile} -vf ${transpose} -crf 23 -c:a copy ${output}`;

  const res1 = await executeCommand({ command: command1 });
  if (!res1) {
    console.log("rotateVideo first exec error");
    console.error("rotateVideo first exec error");
    throw new Error("rotateVideo first exec error");
  }

  const res2 = await executeCommand({ command: command2 });
  if (!res2) {
    console.log("rotateVideo second exec error");
    console.error("rotateVideo second exec error");
    throw new Error("rotateVideo second exec error");
  }

  await fs.remove(tempFile);
}

module.exports = rotateVideo;
