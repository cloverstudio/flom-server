const { Config } = require("#config");
const executeCommand = require("./executeCommand");

async function compareAudioWithSoundalike({ filePath1, filePath2 }) {
  const command = `${Config.soundalikePath} -compare -compare-interval 50 ${filePath1} ${filePath2}`;

  return await executeCommand({ command, returnOutput: true });
}

module.exports = compareAudioWithSoundalike;
