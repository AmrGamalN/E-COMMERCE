const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
require("dotenv").config();
const { handleError } = require("../handleCheck/checkError");
const MiddleWareError = require("../middleware/errorHandler");

const hmac = crypto.createHmac("SHA256", "salt");
const data = hmac.update("nodejsera");
const gen_hmac = data.digest("hex");

const verifyToken = MiddleWareError(async (req, res, next) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) {
      return handleError(400, "FAIL", "TOKEN IS REQUIRED", next);
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return handleError(400, "FAIL", "MALFORMED TOKEN", next);
    }
    const currentUser = jwt.verify(token, gen_hmac, {
      algorithms: ["HS512"],
    });
    req.currentUser = currentUser;
    next();
  } catch (err) {
    return handleError(400, "INVALID OR EXPIRED TOKEN", err.message, next);
  }
});

module.exports = verifyToken;
