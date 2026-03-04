const getNigerianCarrier = require("./getNigerianCarrier");

async function getTelco(phone) {
  const number = phone;
  let network;

  if (
    number.startsWith("+234701") ||
    number.startsWith("+234708") ||
    number.startsWith("+234802") ||
    number.startsWith("+234808") ||
    number.startsWith("+234812") ||
    number.startsWith("+234901") ||
    number.startsWith("+234902") ||
    number.startsWith("+234904") ||
    number.startsWith("+234907") ||
    number.startsWith("+234912")
  ) {
    network = "airtel";
  } else if (number.startsWith("+234702")) {
    network = "Smile";
  } else if (number.startsWith("+2347027") || number.startsWith("+234709")) {
    network = "Multi-Links";
  } else if (
    number.startsWith("+2347028") ||
    number.startsWith("+2347029") ||
    number.startsWith("+234819")
  ) {
    network = "Starcomms";
  } else if (
    number.startsWith("+2347025") ||
    number.startsWith("+2347026") ||
    number.startsWith("+234703") ||
    number.startsWith("+234704") ||
    number.startsWith("+234706") ||
    number.startsWith("+234803") ||
    number.startsWith("+234806") ||
    number.startsWith("+234810") ||
    number.startsWith("+234813") ||
    number.startsWith("+234814") ||
    number.startsWith("+234816") ||
    number.startsWith("+234903") ||
    number.startsWith("+234906") ||
    number.startsWith("+234913") ||
    number.startsWith("+234916")
  ) {
    network = "MTN";
  } else if (
    number.startsWith("+234705") ||
    number.startsWith("+234805") ||
    number.startsWith("+234807") ||
    number.startsWith("+234811") ||
    number.startsWith("+234815") ||
    number.startsWith("+234905") ||
    number.startsWith("+234915")
  ) {
    network = "GLO";
  } else if (number.startsWith("+234707")) {
    network = "ZoomMobile";
  } else if (number.startsWith("+234804")) {
    network = "Mtel";
  } else if (
    number.startsWith("+234809") ||
    number.startsWith("+234817") ||
    number.startsWith("+234818") ||
    number.startsWith("+234909") ||
    number.startsWith("+234908")
  ) {
    network = "9mobile";
  } else {
    network = "unknown";
  }

  if (network === "unknown") {
    console.log("Nigerian carrier not found on backend, sending request to Qrios API...");
    const response = await getNigerianCarrier(number);
    network = !response ? "unknown" : response;
  }

  return network;
}

module.exports = getTelco;
