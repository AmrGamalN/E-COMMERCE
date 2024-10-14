const mongoose = require("mongoose");
const { Types } = mongoose;

// const CategorySchema = new mongoose.Schema(
//   {
//     allCategory: [
//       {
//         categoryName: {
//           type: String,
//           required: true,
//           trim: true,
//         },
//         slug: {
//           type: String,
//           // unique: true,
//         },
//         categoryImage: {
//           type: String,
//         },
//         allProduct: {
//           productName: [{ type: String, required: true, trim: true }],
//           productID: [
//             {
//               type: Types.ObjectId,
//               ref: "Product",
//               required: true,
//             },
//           ],
//           allProductID: {
//             type: String,
//           },
//         },
//         pageId: {
//           type: String,
//         },
//         pageName: { type: String, trim: true },
//       },
//     ],
//     userName: { type: String },
//     email: { type: String },
//     userID: {
//       type: Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

const subCategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
  },
  categoryImage: {
    type: String,
  },
  product: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  page: [{ type: mongoose.Schema.Types.ObjectId, ref: "Page" }],
});

const CategorySchema = new mongoose.Schema(
  {
    user: {
      allCategory: [
        {
          pageName: {
            type: String,
            required: true,
            trim: true,
            alias: "pageTitle",
          },
          category: {
            type: [subCategorySchema],
            alias: "categories of each page",
          },
        },
      ],
    },
    userID: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      alias: "userIdentifier",
    },
    userName: { type: String, alias: "fullName" },
    email: { type: String, alias: "userEmail" },
  },
  { timestamps: true }
);

const categoryModel = mongoose.model("Category", CategorySchema);
module.exports = categoryModel;
