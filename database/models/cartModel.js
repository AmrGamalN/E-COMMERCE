const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cartItems: [
      {
        productID: {
          type: String,
          required: true,
        },
        quantity: { type: Number, default: 1 },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set the review creation date
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const cartModel = mongoose.model("Cart", cartSchema);
module.exports = cartModel;
