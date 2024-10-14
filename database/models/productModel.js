const mongoose = require("mongoose");
const { Types } = mongoose;

const productSchema = new mongoose.Schema(
  {
    allProduct: [
      {
        categoryName: { type: String },
        categoryID: {
          type: Types.ObjectId,
          ref: "category",
        },
        categoryOfProduct: [
          {
            productName: {
              type: String,
              required: true,
              trim: true,
            },
            slug: {
              type: String,
              required: true,
            },
            price: {
              type: Number,
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
            },
            description: {
              type: String,
              required: true,
              trim: true,
            },
            discount: {
              type: Number,
            },
            taxPrice: {
              type: Number,
            },
            status: {
              type: String,
              enum: ["available", "unavailable"],
              default: "available",
            },
            gallery: [{ img: { type: String } }],
            review: {
              reviewID: {
                type: String,
              },
            },
            categoryID: {
              type: Types.ObjectId,
              ref: "category",
            },
            categoryName: { type: String },
          },
        ],
      },
    ],
    userName: { type: String },
    email: { type: String },
    userID: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.query.paginate = function (page) {
  page = page < 1 || isNaN(page) || !page ? 1 : page;
  const limit = 2;
  const skip = limit * (page - 1);
  return this.skip(skip).limit(limit);
};

productSchema.query.search = function (keyword) {
  if (keyword) {
    return this.find({ name: { $regex: keyword, $options: "i" } });
  }
  return this;
};
const productModel = mongoose.model("Product", productSchema);
module.exports = productModel;
