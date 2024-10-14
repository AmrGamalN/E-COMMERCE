const mongoose = require("mongoose");

const transectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  transaction: [
    {
      transaction_id: {
        type: String,
        required: true,
      },
      order_id: {
        type: String,
        required: true,
      },
      amountPrice: {
        type: Number,
        required: true,
      },
      paymentStatus: {
        type: String,
        enum: ["Pending", "Succeeded", "Failed", "Refunded"],
        default: "Pending",
      },
      paymentMethod: {
        type: String,
        enum: ["PayPal", "Credit Card", "Debit Card", "Cash on Delivery"], // Different types of payment methods
        required: true,
      },
      orderStatus: {
        type: String,
        enum: [
          "Pending",
          "Confirmed",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
          "Returned",
          "Failed",
        ],
        default: "pending",
      },
      currency: {
        type: String,
        enum: ["EGP", "USD", "EUR"],
        default: "EGP",
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
      updated_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

transectionSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const transactionModel = mongoose.model("Transaction", transectionSchema);
module.exports = transactionModel;
