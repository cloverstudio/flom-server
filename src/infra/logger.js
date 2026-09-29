const { Config } = require("#config");

const levels = {
  debug: 5,
  info: 4,
  warn: 3,
  error: 2,
  notice: 1,
};

let logLevel = levels.warn;

if (Config.environment === "development" || Config.environment === "local") {
  logLevel = levels.debug;
}

const RED = "\x1b[91m";
const GREEN = "\x1b[92m";
const YELLOW = "\x1b[93m";
const CYAN = "\x1b[96m";
const RESET = "\x1b[0m";
const UNDERLINE = "\x1b[4m";
const UNDERLINE_OFF = "\x1b[24m";
const BOLD = "\x1b[1m";
const BOLD_OFF = "\x1b[22m";

function info(msg, data) {
  printMessage({ msg, data, level: "info" });
}
function debug(msg) {
  printMessage({ msg, level: "debug", COLOR: CYAN });
}
function error(msg, err) {
  printMessage({ msg, err, level: "error", COLOR: RED });
}
function warn(msg, err) {
  printMessage({ msg, err, level: "warn", COLOR: YELLOW });
}
function notice(msg) {
  printMessage({ msg, level: "notice", COLOR: GREEN });
}
function setLogLevel(level) {
  if (!!levels[level]) {
    logLevel = levels[level];
  }
}

function printMessage({ msg = "", data = "", err = null, level, COLOR = "" }) {
  try {
    /* const env = Config.environment;
    if (env !== "development" && level === "debug") return; */

    const env = Config.environment;
    if (levels[level] > logLevel) return;

    const reset = !COLOR ? "" : RESET;
    msg = !err ? msg : `${msg}\n${err.stack}`;
    const now = new Date().toISOString();

    const logMessage = `${COLOR}${now} [${env}] ${BOLD}${UNDERLINE}${level}${UNDERLINE_OFF}${BOLD_OFF}: ${msg}${reset}`;

    if (!data) console.log(logMessage);
    else console.log(logMessage, data);

    if (level === "error") {
      console.error(logMessage);
    }
  } catch (error) {
    console.log("Logger error: " + JSON.stringify(error));
    console.error("Logger error: " + JSON.stringify(error));
  }
}

module.exports = Object.freeze({ info, debug, error, warn, notice, setLogLevel });
