const {
  addPage,
  getAllPage,
  getPageByName,
  deleteAllPage,
  deletePageByName,
} = require("../controllers/PageControl");
const verifyToken = require("../middleware/authenticateToken");
const validPage = require("../utilts/PageValid");
const { BannersPage } = require("../modules/uploadFile");
const requireRole = require("../middleware/requireRole ");
const express = require("express");

const pageRouters = express.Router();
pageRouters
  .route("/addPage")
  .post(verifyToken, validPage(), BannersPage, addPage);

pageRouters.route("/getAllPage").get(verifyToken, getAllPage);
pageRouters.route("/getPageByName").get(verifyToken, getPageByName);

pageRouters.route("/deleteAllPage").delete(verifyToken, deleteAllPage);
pageRouters.route("/deletePageByName").delete(verifyToken, deletePageByName);

module.exports = pageRouters;
