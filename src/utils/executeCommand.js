const util = require("util");
const exec = require("child_process").exec;

async function executeCommand({ command, returnOutput = false }) {
  console.log("executeCommand: ", command);

  const execute = util.promisify(exec);

  if (command.startsWith("ffmpeg")) {
    command = "nice -n -5 " + command;
  }

  try {
    const { stdout } = await execute(command);
    console.log("command success: ", stdout);
    if (returnOutput) return stdout;
    else return true;
  } catch (error) {
    console.error("command error: ", error.stack);
    return false;
  }
}

module.exports = executeCommand;
