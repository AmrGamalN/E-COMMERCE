const match = require("nodemon/lib/monitor/match");
const productModel = require("../database/models/productModel");
const reviewModel = require("../database/models/reviewModel");
const MiddleWareError = require("../middleware/errorHandler");
const { handleError, handleSuccess } = require("../handleCheck/checkError");
const { validationResult } = require("express-validator");

const addReview = MiddleWareError(async (req, res, next) => {
  try {
    const productID = req.params.id;
    const { rating, comment } = req.body;

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleError(400, "FAIL", errors.array(), next);
    }

    // Check if the product exists
    const product = await productModel.findOne({
      "allProduct.categoryOfProduct._id": productID,
    });

    if (!product) {
      return handleError(404, "Product not found", null, next);
    }

    // Check if the user has already reviewed the product
    const checkDuplicateReview = await reviewModel.findOne({
      user: req.currentUser._id,
      "reviewContent.product": productID,
    });

    if (!checkDuplicateReview) {
      // Add the review to the reviewModel
      const addReview = await reviewModel
        .findOneAndUpdate(
          { user: req.currentUser._id },
          {
            $push: {
              reviewContent: {
                product: productID,
                rating: rating,
                comment: comment,
              },
            },
          },
          { upsert: true, new: true }
        )
        .populate("user");

      // Extract the review ID of the newly added review
      const targetReviewId = addReview.reviewContent.find((prod) => {
        if (prod.product.equals(productID)) {
          return [prod._id];
        }
      });

      if (!targetReviewId) {
        return handleError(500, "Failed to retrieve the review", null, next);
      }

      // Update the product's review array with the new review ID
      await productModel.findOneAndUpdate(
        {
          "allProduct.categoryOfProduct._id": productID,
        },
        {
          $addToSet: {
            "allProduct.$[outer].categoryOfProduct.$[inner].review": {
              reviewID: targetReviewId._id,
            },
          },
        },
        {
          arrayFilters: [
            { "outer.categoryOfProduct": { $elemMatch: { _id: productID } } }, // Filter for allProduct to find the category containing the product
            { "inner._id": productID }, // Filter for the specific product inside categoryOfProduct array
          ],
          upsert: false, // We are updating existing records, no need to create new ones
          new: true, // Return the updated document
        }
      );

      return handleSuccess(200, `success`, addReview, next);
    } else {
      return handleSuccess(
        400,
        `fail`,
        "You have already reviewed this product",
        next
      );
    }
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const updateReview = MiddleWareError(async (req, res, next) => {
  try {
    const reviewID = req.params.id;
    const { rating, comment } = req.body;
    const UpdateReview = await reviewModel.findOneAndUpdate(
      {
        user: req.currentUser._id,
        "reviewContent._id": reviewID,
      },
      {
        $set: {
          "reviewContent.$[inner].rating": rating,
          "reviewContent.$[inner].comment": comment,
          "reviewContent.$[inner].updatedAt": new Date(),
        },
      },
      {
        arrayFilters: [{ "inner._id": reviewID }],
        new: true,
      }
    );

    return handleSuccess(
      200,
      `review update succesfully `,
      UpdateReview.reviewContent.find((get) => get._id.equals(reviewID)),
      next
    );
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const deleteReviewToUser = MiddleWareError(async (req, res, next) => {
  try {
    const reviewID = req.params.id;
    // Check if the review exists for the current user
    const findReview = await reviewModel.findOne({
      user: req.currentUser._id,
      "reviewContent._id": reviewID,
    });

    if (!findReview) {
      return handleError(404, "Review not found", null, next);
    }
    // Delete the review from the review model
    await reviewModel.findOneAndUpdate(
      {
        user: req.currentUser._id,
        "reviewContent._id": reviewID,
      },
      {
        $pull: {
          reviewContent: { _id: reviewID },
        },
      },
      {
        new: true,
      }
    );
    // Delete the review from the product model
    await productModel.findOneAndUpdate(
      {
        "allProduct.categoryOfProduct.review.reviewID": reviewID,
      },
      {
        $pull: {
          "allProduct.$[outer].categoryOfProduct.$[inner].review": {
            reviewID: reviewID,
          },
        },
      },
      {
        arrayFilters: [
          {
            "outer.categoryOfProduct": {
              $elemMatch: { "review.reviewID": reviewID },
            },
          },
          { "inner.review.reviewID": reviewID },
        ],
        new: true,
      }
    );
    return handleSuccess(200, `Review deleted successfully`, null, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const deleteAllReviewToProduct = MiddleWareError(async (req, res, next) => {
  try {
    const productID = req.params.id;
    const findProduct = await productModel.findOne({
      userID: req.currentUser._id,
      "allProduct.categoryOfProduct": { $elemMatch: { _id: productID } },
    });

    if (!findProduct) {
      return handleError(404, "product not found", null, next);
    }
    // Delete the review from the product model
    await productModel.findOneAndUpdate(
      {
        "allProduct.categoryOfProduct._id": productID,
      },
      {
        $set: {
          "allProduct.$[outer].categoryOfProduct.$[inner].review": [],
        },
      },
      {
        arrayFilters: [
          { "outer.categoryOfProduct._id": productID },
          { "inner._id": productID },
        ],
        new: true,
      }
    );
    // Delete the review to each user is related with product from the review model
    await reviewModel.updateMany(
      { "reviewContent.product": productID },
      { $pull: { reviewContent: { product: productID } } }
    );
    return handleSuccess(200, `Review deleted successfully`, null, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const getReviewToUser = MiddleWareError(async (req, res, next) => {
  try {
    const productID = req.params.id;
    const findReview = await reviewModel.findOne(
      {
        user: req.currentUser._id,
        reviewContent: { $elemMatch: { _id: productID } },
      },
      {
        "reviewContent.$": 1, // Use $ to project only the matching element from the array
      }
    );
    if (!findReview) {
      return handleError(404, "Review not found", null, next);
    }
    return handleSuccess(200, `success`, findReview, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const getAllReviewToUser = MiddleWareError(async (req, res, next) => {
  try {
    const findReview = await reviewModel.findOne({
      user: req.currentUser._id,
    });
    if (!findReview) {
      return handleError(404, "Review not found", null, next);
    }
    return handleSuccess(200, `success`, findReview, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const getReviewToProduct = MiddleWareError(async (req, res, next) => {
  try {
    const productID = req.params.id;
    const findReview = await productModel.findOne({
      userID: req.currentUser._id,
      "allProduct.categoryOfProduct._id": productID,
    });

    if (!findReview) {
      return handleError(404, "product not found", null, next);
    }

    const targetProduct = findReview.allProduct.find(
      (prod) => prod.categoryOfProduct.find((get) => get._id.equals(productID)) // Use find to match the product
    );

    const matchedProduct = targetProduct.categoryOfProduct.find((get) =>
      get._id.equals(productID)
    );

    return handleSuccess(200, `success`, matchedProduct.review, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const getAllNumberReviewToUser = MiddleWareError(async (req, res, next) => {
  try {
    const findReview = await reviewModel.findOne({
      user: req.currentUser._id,
    });
    if (!findReview) {
      return handleError(404, "Review not found", null, next);
    }
    return handleSuccess(200, `success`, findReview.reviewContent.length, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const getAllNumberReviewToProduct = MiddleWareError(async (req, res, next) => {
  try {
    const productID = req.params.id;
    const findReview = await productModel.findOne({
      userID: req.currentUser._id,
      "allProduct.categoryOfProduct._id": productID,
    });
    if (!findReview) {
      return handleError(404, "product not found", null, next);
    }
    const targetProduct = findReview.allProduct.find(
      (prod) => prod.categoryOfProduct.find((get) => get._id.equals(productID)) // Use find to match the product
    );

    const matchedProduct = targetProduct.categoryOfProduct.find((get) =>
      get._id.equals(productID)
    );
    return handleSuccess(
      200,
      `success`,
      matchedProduct.review.reviewID.length,
      next
    );
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

module.exports = {
  addReview,
  updateReview,
  deleteReviewToUser,
  deleteAllReviewToProduct,
  getReviewToUser,
  getAllReviewToUser,
  getReviewToProduct,
  getAllNumberReviewToUser,
  getAllNumberReviewToProduct,
};

//   .populate({
//     path: "reviewContent.product",
//     match: {
//       "allProduct.categoryOfProduct._id": "66fdbef8bebae62a903a1618", // Match the specific _id from categoryOfProduct
//     },
//     select: "allProduct.categoryOfProduct.review",
//   });
