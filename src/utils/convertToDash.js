const executeCommand = require("./executeCommand");

async function convertToDash(input, output, fileName) {
  const command = `ffmpeg -i ${input} -c copy -map 0 -f dash -seg_duration 10 -init_seg_name ${fileName}-init-\\$RepresentationID\\$.webm -media_seg_name ${fileName}-chunk-\\$RepresentationID\\$-\\$Number%05d\\$.webm -adaptation_sets "id=0,streams=v id=1,streams=a" ${output}`;

  const res2 = await executeCommand({ command });
  if (!res2) {
    console.log("Error while converting webm to dash");
    console.error("Error while converting webm to dash");
    throw new Error("Error while converting webm to dash");
  }

  return;
}

module.exports = convertToDash;
