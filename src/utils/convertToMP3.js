const executeCommand = require("./executeCommand");

async function convertToMP3(input, fileOutput) {
  let output = fileOutput;
  if (!output.includes(".mp3")) {
    output += ".mp3";
  }

  const command = `ffmpeg -i ${input} ${output}`;

  const res = await executeCommand({ command });
  if (!res) {
    console.log("convertToMP3 error");
    console.error("convertToMP3 error");
    throw new Error("convertToMP3 error");
  }
}

module.exports = convertToMP3;
