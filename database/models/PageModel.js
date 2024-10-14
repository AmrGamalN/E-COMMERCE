const mongoose = require("mongoose");
const { options } = require("nodemon/lib/config");
const { regex } = require("uuidv4");
const { Types } = mongoose;

// const PageSchema = new mongoose.Schema(
//   {
//     allPage: [
//       {
//         pageName: {
//           type: String,
//           required: true,
//           trim: true,
//         },
//         description: {
//           type: String,
//           required: true,
//           trim: true,
//         },
//         banners: [
//           {
//             img: { type: String },
//             navigateTo: { type: String },
//           },
//         ],
//         galleryProducts: [
//           {
//             img: { type: String },
//             navigateTo: { type: String },
//           },
//         ],
//         allCategory: {
//           categoryName: [{ type: String, required: true, trim: true }],
//           categoryID: [
//             {
//               type: Types.ObjectId,
//               ref: "category",
//               required: true,
//             },
//           ],
//           allCategoryID: {
//             type: String,
//           },
//         },
//       },
//     ],
//     name: { type: String },
//     email: { type: String },
//     userID: {
//       type: Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

const PageSchema = new mongoose.Schema(
  {
    allPage: [
      {
        pageName: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
        banners: [
          {
            img: { type: String },
            navigateTo: { type: String },
          },
        ],
        galleryProducts: [
          {
            img: { type: String },
            navigateTo: { type: String },
          },
        ],
        category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      },
    ],
    name: { type: String },
    email: { type: String },
    userID: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

PageSchema.query.paginate = function (pageNumber = 1, limit = 2) {
  // Ensure pageNumber is a valid positive integer
  pageNumber = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  // Ensure limit is also a valid positive integer
  limit = Number.isInteger(limit) && limit > 0 ? limit : 2;

  // Calculate how many records to skip
  const skip = limit * (pageNumber - 1);

  // Return the query with pagination applied
  return this.skip(skip).limit(limit);
};

PageSchema.query.search = function (keyword) {
  if (keyword) {
    return this.find({
      allPage: {
        $elemMatch: { pageName: { $regex: keyword, $options: "i" } },
      },
    });
  }
  return this;
};

// PageSchema.pre(/^find/, function (next) {
//   this.populate({ path: "categoryID" });
//   next();
// });

const pageModel = mongoose.model("Page", PageSchema);

module.exports = pageModel;
