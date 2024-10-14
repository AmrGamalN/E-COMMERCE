require("dotenv/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const buffer = require("buffer");

//cryption password
const hashPassword = (value) => {
  const hashPassword = bcrypt.hash(value, 10);
  return hashPassword;
};

//cryption any id  in url
const encryptTransactionId = (id) => {
  const algorithm = process.env.ALGORITHM;
  const iv = crypto.randomBytes(16);
  const mySecretKey = Buffer.from(process.env.MY_SECRET_KEY, "hex");
  let cipher = crypto.createCipheriv(algorithm, mySecretKey, iv);
  let encrypted = cipher.update(id);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decryptTransactionId = (id) => {
  const algorithm = process.env.ALGORITHM;
  const textPart = id.split(":");
  const iv = Buffer.from(textPart.shift(), "hex");
  const encryptedText = Buffer.from(textPart.join(":"), "hex");
  const mySecretKey = Buffer.from(process.env.MY_SECRET_KEY, "hex");
  let decipher = crypto.createDecipheriv(algorithm, mySecretKey, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = { hashPassword, encryptTransactionId, decryptTransactionId };
