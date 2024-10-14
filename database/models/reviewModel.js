const { populate } = require("dotenv");
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewContent: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        rating: {
          type: Number,
          required: true,
          // min: 1, // Minimum rating value (e.g., 1 star)
          // max: 5, // Maximum rating value (e.g., 5 stars)
        },
        comment: {
          type: String,
          required: true,
          trim: true, // Removes leading/trailing whitespace
        },
        createdAt: {
          type: Date,
          default: Date.now, // Automatically set the review creation date
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

const reviewModel = mongoose.model("Review", reviewSchema);
module.exports = reviewModel;
