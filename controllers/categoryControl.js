const categoryModel = require("../database/models/categoryModel");
const productModel = require("../database/models/productModel");
const pageModel = require("../database/models/PageModel");
const slugify = require("slugify");
const { handleError, handleSuccess } = require("../handleCheck/checkError");
const shortid = require("shortid");
const MiddleWareError = require("../middleware/errorHandler");
const { validationResult } = require("express-validator");

const valid = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleError(400, "VALIDATION FAILED", errors.array(), next);
  }
};

// const addCategory = MiddleWareError(async (req, res, next) => {
//   try {

//     const { categoryName, pagename } = req.body;
//     const imagelist = req.files?.categoryImage;

//     // Validate the presence of the required fields
//     if (!categoryName || !pagename) {
//       return handleError(
//         400,
//         "FAIL",
//         "CATEGORY NAME AND PAGE NAME ARE REQUIRED.",
//         next
//       );
//     }

//     // Use Promise.all to fetch category and page simultaneously
//     const [category, page] = await Promise.all([
//       categoryModel.findOne(
//         {
//           userID: req.currentUser._id,
//           "allCategory.categoryName": categoryName,
//         },
//         {
//           "allCategory.$": 1,
//         }
//       ),
//       pageModel.findOne(
//         {
//           userID: req.currentUser._id,
//           "allPage.pageName": pagename,
//         },
//         {
//           "allPage.$": 1,
//         }
//       ),
//     ]);

//     // Check if the page exists
//     if (!page) {
//       return handleError(400, "FAIL", `PAGE '${pagename}' NOT FOUND.`, next);
//     }

//     // Check if the category already exists
//     if (category) {
//       return handleError(
//         400,
//         "FAIL",
//         `CATEGORY '${categoryName}' ALREADY EXISTS.`,
//         next
//       );
//     }

//     // Create a new category object
//     const newCategory = {
//       categoryName,
//       slug: `${slugify(categoryName)}-${shortid.generate()}`,
//       categoryImage: imagelist[0]?.filename, // Optional chaining for safety
//     };

//     // Update category and page in parallel
//     const categoryUpdated = await categoryModel.findOneAndUpdate(
//       {
//         userID: req.currentUser._id,
//         "allCategory.categoryName": { $ne: categoryName },
//       },
//       {
//         userName: `${req.currentUser.fname} ${req.currentUser.lname}`,
//         email: req.currentUser.email,
//         $addToSet: { allCategory: newCategory },
//       },
//       {
//         upsert: true,
//         new: true,
//       }
//     );

//     await pageModel.findOneAndUpdate(
//       {
//         userID: req.currentUser._id,
//         "allPage.pageName": pagename,
//       },
//       {
//         $addToSet: {
//           "allPage.$.allCategory.categoryName": categoryName,
//           "allPage.$.allCategory.categoryID":
//             categoryUpdated.allCategory[categoryUpdated.allCategory.length - 1]
//               ._id,
//         },
//       },
//       {
//         new: true,
//       }
//     );

//     // Return success response with the newly created category
//     return handleSuccess(
//       200,
//       `CATEGORY '${categoryName}' CREATED SUCCESSFULLY.`,
//       categoryUpdated.allCategory[categoryUpdated.allCategory.length - 1],
//       next
//     );
//   } catch (error) {
//     // Handle server error
//     return handleError(
//       500,
//       "INTERNAL SERVER ERROR.",
//       error.response ? error.response.data : error.message,
//       next
//     );
//   }
// });

const addCategory = MiddleWareError(async (req, res, next) => {
  try {
    const { categoryName, pageName } = req.body;
    const imagelist = req.files?.categoryImage;

    // Validate the presence of the required fields
    if (!categoryName || !pageName) {
      return handleError(
        400,
        "FAIL",
        "CATEGORY NAME AND PAGE NAME ARE REQUIRED.",
        next
      );
    }

    const createCategoryObject = () => ({
      categoryName,
      slug: `${slugify(categoryName)}-${shortid.generate()}`,
      categoryImage: imagelist ? imagelist[0]?.filename : undefined,
    });

    const addCategoryIdInPage = async (id) => {
      await pageModel.findOneAndUpdate(
        {
          userID: req.currentUser._id,
          "allPage.pageName": pageName,
        },
        {
          $addToSet: {
            "allPage.$.category": id,
          },
        },
        {
          new: true,
        }
      );
    };

    const [categoryExists, pageExists] = await Promise.all([
      categoryModel.findOne({
        userID: req.currentUser._id,
        "user.allCategory.category.categoryName": categoryName,
        "user.allCategory.pageName": pageName,
      }),
      pageModel.findOne({
        userID: req.currentUser._id,
        "allPage.pageName": pageName,
      }),
    ]);

    if (!pageExists) {
      return handleError(400, "FAIL", `PAGE '${pageName}' NOT FOUND.`, next);
    }

    if (categoryExists) {
      return handleError(
        400,
        "FAIL",
        `CATEGORY '${categoryName}' ALREADY EXISTS.`,
        next
      );
    }

    // Create category in the page if the page exists but category does not
    const categoryUpdate = await categoryModel.findOneAndUpdate(
      {
        userID: req.currentUser._id,
        "user.allCategory.pageName": pageName,
        "user.allCategory.category.categoryName": { $ne: categoryName },
      },
      {
        userName: `${req.currentUser.fname} ${req.currentUser.lname}`,
        email: req.currentUser.email,
        $addToSet: {
          "user.allCategory.$.category": createCategoryObject(),
        },
      },
      {
        new: true,
      }
    );

    if (categoryUpdate) {
      await addCategoryIdInPage(categoryUpdate._id);
      const indexCategory =
        categoryUpdate.user.allCategory[
          categoryUpdate.user.allCategory.length - 1
        ].category.length - 1;
      return handleSuccess(
        200,
        `CATEGORY '${categoryName}' CREATED SUCCESSFULLY.`,
        categoryUpdate.user.allCategory[
          categoryUpdate.user.allCategory.length - 1
        ].category[indexCategory],
        next
      );
    }

    // If page exists but category does not, create new category with the page
    const categoryNewPage = await categoryModel.findOneAndUpdate(
      {
        userID: req.currentUser._id,
        "user.allCategory.pageName": { $ne: pageName },
      },
      {
        userName: `${req.currentUser.fname} ${req.currentUser.lname}`,
        email: req.currentUser.email,
        $addToSet: {
          "user.allCategory": {
            pageName: pageName,
            category: [createCategoryObject()],
          },
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    if (categoryNewPage) {
      await addCategoryIdInPage(categoryNewPage._id);
      const indexNewCategory =
        categoryNewPage.user.allCategory[
          categoryNewPage.user.allCategory.length - 1
        ].category.length - 1;
      return handleSuccess(
        200,
        `CATEGORY '${categoryName}' CREATED SUCCESSFULLY.`,
        categoryNewPage.user.allCategory[
          categoryNewPage.user.allCategory.length - 1
        ].category[indexNewCategory],
        next
      );
    }
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getAllCategory = MiddleWareError(async (req, res, next) => {
  try {
    const categories = await categoryModel.findOne({
      userID: req.currentUser._id,
    });

    if (!categories) {
      return handleError(404, "NOT FOUND", "NO CATEGORIES FOUND.", next);
    }

    return handleSuccess(
      200,
      "ALL CATEGORIES RETRIEVED SUCCESSFULLY.",
      categories,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getCategoryByID = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);

    const category = await categoryModel.findOne(
      {
        userID: req.currentUser._id,
        "allCategory._id": req.params.id,
      },
      { "allCategory.$": 1 }
    );

    // Check if category exists
    if (!category) {
      return handleError(404, "NOT FOUND", "NO CATEGORY FOUND.", next);
    }

    return handleSuccess(
      200,
      "CATEGORY RETRIEVED SUCCESSFULLY.",
      category,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getCategoryByName = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { categoryName } = req.body;
    const categories = await categoryModel.findOne(
      {
        userID: req.currentUser._id,
        "allCategory.categoryName": categoryName,
      },
      { "allCategory.$": 1 }
    );
    if (!categories) {
      return handleError(
        404,
        "NOT FOUND",
        `NO CATEGORY NAMED '${categoryName}' FOUND FOR THIS USER.`,
        next
      );
    }
    return handleSuccess(
      200,
      "CATEGORY RETRIEVED SUCCESSFULLY.",
      categories,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getAllProductOfCategory = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { categoryName } = req.body;
    const category = await categoryModel.findOne(
      {
        userID: req.currentUser._id,
        "allCategory.categoryName": categoryName,
      },
      {
        "allCategory.$": 1,
      }
    );
    if (!category) {
      return handleError(
        404,
        "FAIL",
        "NO CATEGORY FOUND WITH THIS NAME.",
        next
      );
    }
    return handleSuccess(
      200,
      "PRODUCTS RETRIEVED SUCCESSFULLY.",
      targetCategory.allProduct,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getPageOfCategory = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { categoryName } = req.body;
    const page = await pageModel.findOne(
      {
        userID: req.currentUser._id,
        "allPage.allCategory.categoryName": categoryName,
      },
      {
        "allPage.$": 1,
      }
    );
    if (!page) {
      return handleError(
        404,
        "NOT FOUND",
        `NO CATEGORY '${categoryName}' FOUND WITH THIS NAME.`,
        next
      );
    }
    return handleSuccess(
      200,
      "PAGES RETRIEVED SUCCESSFULLY.",
      page.allPage[0].pageName,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getAllCategoryToeachUser = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const categories = await categoryModel.find(
      { userID: req.currentUser._id },
      { __v: false }
    );

    if (!categories || categories.length === 0) {
      return handleError(404, "NOTFOUND", "NO CATEGORY FOUND.", next);
    }
    return handleSuccess(200, "FOUND ALL CATEGORIES", categories, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const deleteAllCategoryByID = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const category = await categoryModel.findOneAndUpdate(
      {
        userID: req.currentUser._id,
        "allCategory._id": id,
      },
      {
        $pull: { allCategory: { _id: id } },
      },
      { new: true }
    );

    if (!category) {
      return handleError(404, "NOT FOUND", "NO CATEGORIES FOUND.", next);
    }

    await productModel.deleteMany({ userID: req.currentUser._id });
    return handleSuccess(
      200,
      "ALL CATEGORIES AND PRODUCTS DELETED SUCCESSFULLY.",
      [],
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const deleteCategoryByID = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const categoryID = req.params.id;
    const category = await categoryModel.findOneAndUpdate(
      {
        userID: req.currentUser._id,
        "allCategory._id": categoryID,
      },
      {
        $pull: { allCategory: { _id: categoryID } },
      },
      { new: false }
    );
    await Promise.all([
      pageModel.findOneAndUpdate(
        {
          userID: req.currentUser._id,
          "allPage.allCategory.categoryID": categoryID,
        },
        {
          $pull: {
            "allPage.$.allCategory.categoryID": categoryID,
            "allPage.$.allCategory.categoryName":
              category.allCategory[0].categoryName,
          },
        },
        { new: true }
      ),
      productModel.findOneAndUpdate(
        {
          userID: req.currentUser._id,
          "allProduct.categoryID": categoryID,
        },
        {
          $pull: { allProduct: { categoryID: categoryID } },
        },
        {
          new: true,
        }
      ),
    ]);
    if (!category) {
      return handleError(404, "NOT FOUND", "NO CATEGORIES FOUND.", next);
    }
    return handleSuccess(
      200,
      `CATEGORY '${category.allCategory[0].categoryName}' AND PRODUCTS DELETED SUCCESSFULLY.`,
      [],
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const deleteCategoryByName = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { categoryName } = req.body;
    const category = await categoryModel.findOneAndUpdate(
      {
        userID: req.currentUser._id,
        "allCategory.categoryName": categoryName,
      },
      {
        $pull: { allCategory: { categoryName: categoryName } },
      },
      { new: false }
    );
    await Promise.all([
      pageModel.findOneAndUpdate(
        {
          userID: req.currentUser._id,
          "allPage.allCategory.categoryName": categoryName,
        },
        {
          $pull: {
            "allPage.$.allCategory.categoryID": category.allCategory[0]._id,
            "allPage.$.allCategory.categoryName": categoryName,
          },
        },
        { new: true }
      ),
      productModel.findOneAndUpdate(
        {
          userID: req.currentUser._id,
          "allProduct.categoryName": categoryName,
        },
        {
          $pull: { allProduct: { categoryName: categoryName } },
        },
        { new: true }
      ),
    ]);

    if (!category) {
      return handleError(404, "NOTFOUND", "NO CATEGORIES FOUND.", next);
    }
    return handleSuccess(
      200,
      `CATEGORY '${categoryName}' AND RELATED PRODUCTS DELETED SUCCESSFULLY.`,
      [],
      next
    );
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const updateCategoryByID = MiddleWareError(async (req, res, next) => {
  try {
    // valid(req, next);
    const categoryId = req.params.id;
    const { categoryName } = req.body;
    const imagelist = req.files?.categoryImage || [];

    if (!imagelist.length)
      return handleError(400, "NOTFOUND", "Category image is required.", next);
    const category = await categoryModel.findOneAndUpdate(
      {
        userID: req.currentUser._id,
        "allCategory._id": categoryId,
      },
      {
        $set: {
          "allCategory.$.categoryName": categoryName,
          "allCategory.$.slug": `${slugify(
            categoryName
          )}-${shortid.generate()}`,
          "allCategory.$.categoryImage": imagelist[0].filename,
        },
      },
      { new: true }
    );

    await pageModel.findOneAndUpdate(
      {
        userID: req.currentUser._id,
        "allPage.allCategory.categoryId": categoryId,
      },
      {
        $set: {
          "allPage.allCategory.categoryName": categoryName,
          "allPage.allCategory.categoryId": categoryId,
        },
      },
      { new: true }
    );

    await Promise.all([
      pageModel.findOneAndUpdate(
        {
          userID: req.currentUser._id,
          "allPage.allCategory.categoryID": categoryId,
        },
        {
          $set: {
            "allPage.$.allCategory.$[elem].categoryName": categoryName,
          },
        },
        { arrayFilters: [{ "elem.categoryID": categoryId }], new: true }
      ),
      productModel.findOneAndUpdate(
        {
          userID: req.currentUser._id,
          "allProduct.categoryId": categoryId,
        },
        {
          $set: { allProduct: { categoryName: categoryName } },
        },
        { new: true }
      ),
    ]);

    if (!category)
      return handleError(404, "NOTFOUND", "Category not found.", next);

    return handleSuccess(200, "Category updated successfully.", category, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

module.exports = {
  addCategory,
  getAllCategory,
  getCategoryByID,
  getCategoryByName,
  getAllProductOfCategory,
  getPageOfCategory,
  getAllCategoryToeachUser,
  deleteCategoryByID,
  deleteAllCategoryByID,
  deleteCategoryByName,
  updateCategoryByID,
};
