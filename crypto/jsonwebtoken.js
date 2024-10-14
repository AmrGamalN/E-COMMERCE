const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
require("dotenv").config();

const hmac = crypto.createHmac("SHA256", "salt");
const data = hmac.update("nodejsera");
const gen_hmac = data.digest("hex");

const genreateToken = async (payloads) => {
  const token = jwt.sign(payloads, gen_hmac, {
    algorithm: "HS512",
    expiresIn: "5h",
  });
  return token;
};

const genreateTokenConfirm = async (payloads) => {
  const token = jwt.sign(payloads, gen_hmac, {
    algorithm: "HS512",
    expiresIn: "60s",
  });
  return token;
};

module.exports = { genreateToken, genreateTokenConfirm };
