const {
  getProductBySearch,
  getProductById,
  addProduct,
  updateProduct,
  deleteAllProduct,
  deleteProduct,
} = require("../controllers/productControl");
const verifyToken = require("../middleware/authenticateToken");
const { requireRole } = require("../middleware/requireRole ");

const validProduct = require("../utilts/productValid");
const { cpUpload } = require("../modules/uploadFile");
const express = require("express");
const productRouters = express.Router();

productRouters
  .route("/api/product")
  .get(verifyToken, getProductBySearch) // متنساش تعمل  populate to select  داتا معينه
  .post(verifyToken, validProduct(), cpUpload, addProduct);
productRouters
  .route("/api/product/:id")
  .get(verifyToken, requireRole("ADMIN"), getProductById)
  .patch(verifyToken, validProduct(), cpUpload, updateProduct)
  .delete(verifyToken, deleteProduct);
productRouters
  .route("/api/product/deleteAllProduct/:id")
  .delete(verifyToken, requireRole("ADMIN"), deleteAllProduct);

module.exports = productRouters;
