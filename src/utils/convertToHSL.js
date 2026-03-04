const executeCommand = require("./executeCommand");

async function convertToHSL(input, output, segmentTimesList) {
  if (!segmentTimesList) {
    throw new Error("convertToHSL - no segmentTimesList!");
  }

  let command = `ffmpeg -i ${input} -map 0 -c copy -f ssegment -segment_list ${
    output + ".m3u8"
  } -segment_times ${segmentTimesList} -break_non_keyframes 0 ${output + "%03d.ts"}`;

  console.log("hls command: " + command);

  const res = await executeCommand({ command });
  if (!res) {
    console.log("Error while converting mp4 to HLS");
    console.error("Error while converting mp4 to HLS");
    throw new Error("Error while converting mp4 to HLS");
  }

  return;
}

module.exports = convertToHSL;
