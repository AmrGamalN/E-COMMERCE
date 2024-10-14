const {
  addReview,
  updateReview,
  deleteReviewToUser,
  deleteAllReviewToProduct,
  getReviewToUser,
  getAllReviewToUser,
  getReviewToProduct,
  getAllNumberReviewToUser,
  getAllNumberReviewToProduct,
} = require("../controllers/reviewControl");
const verifyToken = require("../middleware/authenticateToken");
const validReview = require("../utilts/reviewValid");
const { requireRole } = require("../middleware/requireRole ");

const express = require("express");
const reviewRouters = express.Router();
reviewRouters
  .route("/addreview/:id")
  .post(verifyToken, validReview(), requireRole("ADMIN" || "USER"), addReview);
reviewRouters
  .route("/updateReview/:id")
  .put(
    verifyToken,
    validReview(),
    requireRole("ADMIN" || "USER"),
    updateReview
  );
reviewRouters
  .route("/deleteReviewToUser/:id")
  .delete(verifyToken, requireRole("ADMIN" || "USER"), deleteReviewToUser);
reviewRouters
  .route("/deleteAllReviewToProduct/:id")
  .delete(verifyToken, requireRole("ADMIN"), deleteAllReviewToProduct);

reviewRouters
  .route("/getReviewToUser/:id")
  .get(verifyToken, requireRole("ADMIN"), getReviewToUser);

reviewRouters
  .route("/getAllReviewToUser")
  .get(verifyToken, requireRole("ADMIN"), getAllReviewToUser);

reviewRouters
  .route("/getReviewToProduct/:id")
  .get(verifyToken, requireRole("ADMIN"), getReviewToProduct);

reviewRouters
  .route("/getAllNumberReviewToUser")
  .get(verifyToken, requireRole("ADMIN"), getAllNumberReviewToUser);

reviewRouters
  .route("/getAllNumberReviewToProduct/:id")
  .get(verifyToken, requireRole("ADMIN"), getAllNumberReviewToProduct);

module.exports = reviewRouters;
