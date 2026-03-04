/** Handles Encryption using Node.js native crypto */

const crypto = require("crypto");
const { Config } = require("#config");

var RNCryptor = {};

/*
  Takes password string and salt Buffer
  Returns key Buffer
*/
RNCryptor.KeyForPassword = function (password, salt) {
  return crypto.pbkdf2Sync(password, salt, 3, 32, "sha1");
};

/*
  Takes password string and plaintext Buffer
  options:
    iv
    encryption_salt
    hmac_salt
  Returns ciphertext Buffer
*/
RNCryptor.Encrypt = function (password, plaintext, options) {
  options = options || {};

  const encryption_salt = options["encryption_salt"] || crypto.randomBytes(8);
  const encryption_key = RNCryptor.KeyForPassword(password, encryption_salt);

  const hmac_salt = options["hmac_salt"] || crypto.randomBytes(8);
  const hmac_key = RNCryptor.KeyForPassword(password, hmac_salt);

  const iv = options["iv"] || crypto.randomBytes(16);

  const version = Buffer.from([0x03]);
  const opts = Buffer.from([0x01]);

  // Build message header
  let message = Buffer.concat([version, opts, encryption_salt, hmac_salt, iv]);

  // Encrypt using AES-256-CBC
  const cipher = crypto.createCipheriv("aes-256-cbc", encryption_key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  // Append encrypted data
  message = Buffer.concat([message, encrypted]);

  // Create HMAC
  const hmac = crypto.createHmac("sha256", hmac_key);
  hmac.update(message);
  const hmacDigest = hmac.digest();

  // Append HMAC to message
  message = Buffer.concat([message, hmacDigest]);

  return message;
};

/*
  Takes password string and message (ciphertext) Buffer
  Returns plaintext Buffer
*/
RNCryptor.Decrypt = function (password, message) {
  // Parse message structure
  const version = message[0];
  const options = message[1];

  const encryption_salt = message.slice(2, 10);
  const encryption_key = RNCryptor.KeyForPassword(password, encryption_salt);

  const hmac_salt = message.slice(10, 18);
  const hmac_key = RNCryptor.KeyForPassword(password, hmac_salt);

  const iv = message.slice(18, 34);

  const ciphertext_end = message.length - 32;
  const ciphertext = message.slice(34, ciphertext_end);
  const hmac_received = message.slice(ciphertext_end);

  // Verify HMAC
  const hmac = crypto.createHmac("sha256", hmac_key);
  hmac.update(message.slice(0, ciphertext_end));
  const expected_hmac = hmac.digest();

  if (!crypto.timingSafeEqual(hmac_received, expected_hmac)) {
    throw new Error("HMAC mismatch or bad password.");
  }

  // Decrypt using AES-256-CBC
  const decipher = crypto.createDecipheriv("aes-256-cbc", encryption_key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted;
};

const Encryption = {
  init: function (callBack) {
    // Native crypto doesn't need initialization
    if (callBack) callBack();
  },

  encryptText: function (text) {
    if (!text || text.length === 0) return "";

    try {
      const plaintext = Buffer.from(text, "utf8");
      const encryptedBuffer = RNCryptor.Encrypt(Config.AESPassword, plaintext);
      return encryptedBuffer.toString("hex");
    } catch (ex) {
      console.log(ex);
      return "";
    }
  },

  decryptText: function (text) {
    try {
      const encryptedBuffer = Buffer.from(text, "hex");
      const plaintext = RNCryptor.Decrypt(Config.AESPassword, encryptedBuffer);
      return plaintext.toString("utf8");
    } catch (ex) {
      console.log(ex);
      return "";
    }
  },
};

module.exports = Encryption;
