const mongoose = require("mongoose");
const { required } = require("nodemon/lib/config");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  uintPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  taxPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  building: {
    type: Number,
  },
  apartment: {
    type: Number,
  },
  postalCode: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
});

const itemsPriceSchema = new mongoose.Schema({
  subtotal: {
    type: Number,
    required: true,
  },
  shippingPrice: {
    type: Number,
    required: true,
  },
  taxPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const transactionItemsSchema = new mongoose.Schema({
  paymentMethod: {
    type: String,
    enum: ["PayPal", "Credit Card", "Debit Card", "Cash on Delivery"], // Different types of payment methods
  },
  transaction_id: {
    type: String,
    unquie: true,
    // required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Succeeded", "Failed", "Refunded"],
    default: "Pending",
  },
  currency: {
    type: String,
    enum: ["EGP", "USD", "EUR"],
    default: "EGP",
  },
  amountPrice: {
    type: Number,
    required: true,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
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
    default: "Pending",
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: [
      {
        orderItems: orderItemSchema,
        shippingAddress: shippingAddressSchema,
        PriceItems: itemsPriceSchema,
        transactionItems: transactionItemsSchema,
        numberOrder: {
          type: Number,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const OrderModel = mongoose.model("Order", orderSchema);
module.exports = OrderModel;
