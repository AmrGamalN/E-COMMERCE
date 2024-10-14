const express = require("express");
const categoryRouters = express.Router();
const validCategory = require("../utilts/categoryValid");
const {
  addCategory,
  getAllCategory,
  getCategoryByID,
  getCategoryByName,
  getAllProductOfCategory,
  getPageOfCategory,
  getAllCategoryToeachUser,
  deleteCategoryByID,
  deleteAllCategoryByID,
  deleteCategoryByName,
  updateCategoryByID,
} = require("../controllers/categoryControl");
const verifyToken = require("../middleware/authenticateToken");
const { cpSingle } = require("../modules/uploadFile");
const requireRole = require("../middleware/requireRole ");

categoryRouters
  .route("/addCategory")
  .post(verifyToken, validCategory(), cpSingle, addCategory);
categoryRouters.route("/getAllCategory").get(verifyToken, getAllCategory);
categoryRouters.route("/getCategoryByID/:id").get(verifyToken, getCategoryByID);
categoryRouters
  .route("/getCategoryByName")
  .post(verifyToken, getCategoryByName);
categoryRouters
  .route("/getAllCategoryToeachUser")
  .get(verifyToken, getAllCategoryToeachUser);
categoryRouters
  .route("/getAllProductOfCategory")
  .post(verifyToken, getAllProductOfCategory);
categoryRouters
  .route("/getPageOfCategory")
  .post(verifyToken, getPageOfCategory);
categoryRouters
  .route("/deleteCategoryByID/:id")
  .delete(verifyToken, deleteCategoryByID);
categoryRouters
  .route("/deleteAllCategoryByID")
  .delete(verifyToken, deleteAllCategoryByID);
categoryRouters
  .route("/deleteCategoryByName")
  .delete(verifyToken, deleteCategoryByName);
categoryRouters
  .route("/updateCategoryByID/:id")
  .patch(verifyToken, validCategory(), cpSingle, updateCategoryByID);

module.exports = categoryRouters;
