const pageModel = require("../database/models/PageModel");
const categoryModel = require("../database/models/categoryModel");
const productModel = require("../database/models/productModel");
const MiddleWareError = require("../middleware/errorHandler");
const {
  handleError,
  handleSuccess,
  checkRequiredFields,
} = require("../handleCheck/checkError");

const addPage = MiddleWareError(async (req, res, next) => {
  try {
    const { pageName, description } = req.body;
    const galleryBanners = req.files?.galleryBanners;
    const galleryProducts = req.files?.galleryProducts;

    checkRequiredFields(
      [
        { value: pageName },
        { value: description },
        { value: galleryBanners },
        { value: galleryProducts },
      ],
      next
    );

    // Prepare the page details
    const pageDetails = {
      allPage: {
        pageName,
        description,
        banners: galleryBanners,
        galleryProducts: galleryProducts,
      },
      name: `${req.currentUser.fname} ${req.currentUser.lname}`,
      email: req.currentUser.email,
      userID: req.currentUser._id,
    };

    // If no existing pages, create a new page
    const existingPage = await pageModel.findOne({
      userID: req.currentUser._id,
    });
    if (!existingPage) {
      const newPage = new pageModel(pageDetails, { __v: false });
      await newPage.save();
      return handleSuccess(
        200,
        `Page ${pageName} created successfully`,
        pageDetails,
        next
      );
    }

    // If pages exist, check if the page name already exists
    const pageNames = existingPage.allPage.map((page) => page.pageName);
    if (pageNames.includes(pageName)) {
      return handleError(400, `Page ${pageName} already exists`, null, next);
    }

    // Update the existing page with new page details
    await pageModel.findOneAndUpdate(
      { userID: req.currentUser._id },
      { $addToSet: { allPage: pageDetails.allPage } }
    );
    return handleSuccess(
      200,
      `Page ${pageName} update successfully`,
      pageDetails,
      next
    );
  } catch (error) {
    return handleError(500, "Internal server error", error, next);
  }
});

const getAllPage = MiddleWareError(async (req, res, next) => {
  try {
    const pages = await pageModel
      .find({
        userID: req.currentUser._id,
      })
      .populate({
        path: "allPage.category",
        select: "user.allCategory.category",
      });
    if (!pages) {
      return handleError(404, "NOT FOUND", "NO PAGE FOUND.", next);
    }
    return handleSuccess(200, "ALL PAGE RETRIEVED SUCCESSFULLY.", pages, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getPageByName = MiddleWareError(async (req, res, next) => {
  try {
    const { pageName } = req.body;
    const page = await pageModel
      .findOne(
        {
          userID: req.currentUser._id,
          "allPage.pageName": pageName,
        },
        {
          "allPage.$": 1,
        }
      )
      .populate({
        path: "allPage.category",
        match: { "user.allCategory.pageName": pageName },
        select: { "user.allCategory.$": 1 },
      });

    if (!page) {
      return handleError(404, "NOT FOUND", "NO PAGE FOUND.", next);
    }

    return handleSuccess(200, "ALL PAGE RETRIEVED SUCCESSFULLY.", page, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR.",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const deleteAllPage = MiddleWareError(async (req, res, next) => {
  try {
    const page = await pageModel.findOne({ userID: req.currentUser._id });
    if (!page) {
      return handleError(404, "Page does not exist", null, next);
    }

    await Promise.all([
      pageModel.findOneAndDelete({ userID: req.currentUser._id }),
      categoryModel.findOneAndDelete({ userID: req.currentUser._id }),
      productModel.findOneAndDelete({ userID: req.currentUser._id }),
    ]);

    return handleSuccess(200, "All pages deleted successfully", null, next);
  } catch (error) {
    return handleError(500, "Internal server error", error, next);
  }
});

const deletePageByName = MiddleWareError(async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const page = await pageModel.findOne({ "allPage.pageName": keyword });
    const categories = await categoryModel.findOne({
      "allCategory.pageName": keyword,
    });

    if (!page) {
      return handleError(404, "Page not found", null, next);
    }

    if (categories) {
      categories.allCategory = categories.allCategory.filter(
        (category) => category.pageName !== keyword
      );
      await categories.save();

      for (const category of categories.allCategory) {
        const products = await productModel.findOne({
          "allProduct.categoryName": category.categoryName,
        });
        if (products) {
          products.allProduct = products.allProduct.filter(
            (product) => product.categoryName !== category.categoryName
          );
          await products.save();
        }
      }
    }

    page.allPage = page.allPage.filter((p) => p.pageName !== keyword);
    await page.save();
    return handleSuccess(200, "Page deleted successfully", null, next);
  } catch (error) {
    return handleError(500, "Internal server error", error, next);
  }
});

module.exports = {
  addPage,
  getAllPage,
  getPageByName,
  deleteAllPage,
  deletePageByName,
};
