const path = require("path");
const executeCommand = require("./executeCommand");

async function convertToOgg(input) {
  if (!input) {
    throw new Error("Input file is required");
  }

  const { dir, name } = path.parse(input);
  const output = path.join(dir, `${name}.ogg`);

  if (path.resolve(output) === path.resolve(input)) {
    throw new Error("Output would overwrite input");
  }

  const command = `ffmpeg -y -i ${input} -vn -map_metadata -1 -c:a libopus -b:a 32k -ac 1 -ar 48000 -application voip ${output}`;

  const res = await executeCommand({ command });

  if (!res) {
    throw new Error("convertToOgg error");
  }

  return `${name}.ogg`;
}

module.exports = convertToOgg;
