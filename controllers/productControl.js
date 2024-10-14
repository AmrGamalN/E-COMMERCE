const productModel = require("../database/models/productModel");
const categoryModel = require("../database/models/categoryModel");
const slugify = require("slugify");
const MiddleWareError = require("../middleware/errorHandler");
const {
  handleError,
  handleSuccess,
  checkRequiredFields,
} = require("../handleCheck/checkError");
const shortid = require("shortid");

const addProduct = MiddleWareError(async (req, res, next) => {
  try {
    const {
      productName,
      price,
      quantity,
      description,
      discount,
      taxPrice,
      categoryname,
    } = req.body;
    const imagelist = req.files?.gallery;
    console.log("amrooooooo");
    // Check for required fields
    checkRequiredFields(
      [
        { value: productName },
        { value: price },
        { value: quantity },
        { value: description },
        { value: discount },
        { value: taxPrice },
        { value: categoryname },
        { value: imagelist },
      ],
      next
    );

    // Fetch the active category based on category name
    const categorys = await categoryModel.find({ userID: req.currentUser._id });
    const activeCategory = categorys.find((category) =>
      category.allCategory.some((ct) => ct.categoryName === categoryname)
    );

    // Return error if category is not found
    if (!activeCategory) {
      return handleError(
        400,
        "BADREQUEST",
        `The Category '${categoryname}' was not found. Please create a new Category.`,
        next
      );
    }

    const targetCategory = activeCategory.allCategory.find(
      (ct) => ct.categoryName === categoryname
    );
    // Check if product already exists on the target page
    if (targetCategory.allProduct.productName.includes(productName)) {
      return handleError(
        400,
        "BADREQUEST",
        `Product '${productName}' already exists on this category.`,
        next
      );
    }

    // Create new category object
    const newProduct = {
      productName,
      slug: `${slugify(req.body.productName)}-${shortid.generate()}`,
      price,
      quantity,
      description,
      discount,
      taxPrice,
      gallery: imagelist,
      categoryname,
      categoryID: targetCategory._id,
    };

    // Add new product to the database
    const products = await productModel.find({ userID: req.currentUser._id });
    const activeProduct = products.find((product) =>
      product.allProduct.some((ct) => ct.categoryName === categoryname)
    );

    // Retrieve updated product and find the newly added one
    if (!activeProduct) {
      await productModel.updateOne(
        {
          userID: req.currentUser._id,
        },
        {
          userName: req.currentUser.fname + " " + req.currentUser.lname,
          email: req.currentUser.email,
          $addToSet: {
            allProduct: {
              categoryName: categoryname,
              categoryID: targetCategory._id,
            },
          },
        },
        { upsert: true }
      );
    }

    await productModel.updateOne(
      { userID: req.currentUser._id, "allProduct.categoryName": categoryname },
      {
        $addToSet: {
          "allProduct.$.categoryOfProduct": newProduct,
        },
      },
      { upsert: true, new: true }
    );

    //to add Product ID in category
    const getProducts = await productModel.find({
      userID: req.currentUser._id,
    });
    const activeProduct1 = getProducts.find((product) =>
      product.allProduct.some((ct) => ct.categoryName === categoryname)
    );
    const targetProduct = activeProduct1.allProduct.find((pr) => {
      return pr.categoryOfProduct;
    });

    // Update the category with the newly added category
    await categoryModel.updateOne(
      { userID: req.currentUser._id, "allCategory.categoryName": categoryname },
      {
        $addToSet: {
          "allCategory.$.allProduct.productName": productName,
          "allCategory.$.allProduct.productID":
            targetProduct.categoryOfProduct[
              targetProduct.categoryOfProduct.length - 1
            ]._id,
        },
      }
    );

    return handleSuccess(
      200,
      "CATEGORY CREATED SUCCESSFULLY",
      newProduct,
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

const getProductBySearch = MiddleWareError(async (req, res, next) => {
  try {
    const { sort, page, keyword } = req.query;
    const query = productModel.find();

    if (sort) query.sort(sort);
    const products = await query.paginate(page).search(keyword);

    if (!products.length) {
      return handleError(400, "NOT FOUND PRODUCT", null, next);
    }
    return handleSuccess(200, "FOUND", products, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const getProductById = MiddleWareError(async (req, res, next) => {
  try {
    const productId = req.params.id;

    const product = await productModel.findOne({
      userID: req.currentUser._id,
      "allProduct.categoryOfProduct._id": productId,
    });

    if (product) {
      const targetProduct = foundProduct.allProduct.find((product) =>
        product.categoryOfProduct.some((cat) => cat._id.equals(productId))
      );

      if (targetProduct) {
        for (let i in targetProduct.categoryOfProduct) {
          // Compare the ObjectId correctly
          if (targetProduct.categoryOfProduct[i]._id.equals(productId)) {
            return handleSuccess(
              200,
              "FOUND",
              targetProduct.categoryOfProduct[i],
              next
            );
          }
        }
      } else {
        return handleError(400, "NOT FOUND ANY PRODUCT", null, next);
      }
    } else {
      return handleError(400, "NOT FOUND PRODUCT", null, next);
    }
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const deleteAllProduct = MiddleWareError(async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await productModel.findOne({
      _id: productId,
    });

    if (!product) {
      return handleError(400, "NOT FOUND PRODUCT", null, next);
    }

    await productModel.findByIdAndDelete(productId);
    await categoryModel.findOneAndDelete({ _iduserID: req.current_id });

    return handleSuccess(200, "DELETE SUCCESSFULLY", [], next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const deleteProduct = MiddleWareError(async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await productModel.findOne({
      userID: req.currentUser._id,
      "allProduct.categoryOfProduct._id": productId,
    });

    if (!product) {
      return handleError(400, "NOT FOUND PRODUCT", null, next);
    }

    const category = await categoryModel.findOne({
      allCategory: { $elemMatch: { categoryName: req.body.categoryName } },
    });

    product.allProduct.forEach(async (item, i) => {
      if (
        req.currentUser._id.equals(product.userID) &&
        req.body.categoryName === item.categoryName
      ) {
        item.categoryOfProduct = item.categoryOfProduct.filter(
          (p) => !p._id.equals(productId)
        );
        category.allCategory[i].allProduct.productName = category.allCategory[
          i
        ].allProduct.productName.filter(
          (name) => name !== req.body.productName
        );
        category.allCategory[i].allProduct.productID = category.allCategory[
          i
        ].allProduct.productID.filter((id) => id !== productId);

        await product.save();
        await category.save();

        return handleSuccess(200, "DELETE SUCCESSFULLY", [], next);
      }
    });
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const updateProduct = MiddleWareError(async (req, res, next) => {
  try {
    const productId = req.params.id;
    const imagelist = req.files.gallery.map((file) => ({ img: file.filename }));
    const product = await productModel.findOne({
      userID: req.currentUser._id,
      "allProduct.categoryOfProduct._id": productId,
    });

    if (!product) {
      return handleError(400, "NOT FOUND PRODUCT", null, next);
    }

    const category = await categoryModel.findOne({
      allCategory: { $elemMatch: { categoryName: req.body.categoryName } },
    });

    const targetProduct = product.allProduct.find(
      (item) => item.categoryName === req.body.categoryName
    );

    const targetProductDetails = targetProduct.categoryOfProduct.find((p) =>
      p._id.equals(productId)
    );

    if (targetProductDetails) {
      Object.assign(targetProductDetails, {
        productName: req.body.productName,
        slug: `${slugify(req.body.productName)}-${shortid.generate()}`,
        price: req.body.price,
        quantity: req.body.quantity,
        description: req.body.description,
        discount: req.body.discount,
        gallery: imagelist,
      });
      await product.save();

      const categoryProduct = category.allCategory.find(
        (cat) => cat.categoryName === req.body.categoryName
      );

      const categoryProductIndex =
        categoryProduct.allProduct.productName.indexOf(req.body.oldNameProduct);
      if (categoryProductIndex !== -1) {
        categoryProduct.allProduct.productName[categoryProductIndex] =
          req.body.productName;
        await category.save();
      }
      return handleSuccess(200, "UPDATE SUCCESSFULLY", product, next);
    }

    return handleError(400, "PRODUCT NOT FOUND IN CATEGORY", null, next);
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
  getProductBySearch,
  getProductById,
  addProduct,
  deleteAllProduct,
  deleteProduct,
  updateProduct,
};
