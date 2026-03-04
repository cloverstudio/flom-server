const { bech32 } = require("bech32");

function encodeLnUrl(rawString) {
  const buffer = Buffer.from(rawString);
  const dataPart = bech32.toWords(buffer);
  const encoded = bech32.encode("lnurl", dataPart);
  return encoded.toUpperCase();
}

module.exports = encodeLnUrl;
