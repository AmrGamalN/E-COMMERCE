const cartModel = require("../database/models/cartModel");
const productModel = require("../database/models/productModel");
const MiddleWareError = require("../middleware/errorHandler");
const { handleError, handleSuccess } = require("../handleCheck/checkError");
const { validationResult } = require("express-validator");
//amrooooooooooooooo comment new
const valid = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleError(400, "VALIDATION FAILED", errors.array(), next);
  }
};

const addCart = async (req, res, next) => {
  try {
    console.log("aaaaaaa");
    valid(req, next);
    const { quantity } = req.body;
    const productId = req.params.id;
    const [cart, prodcut] = await Promise.all([
      cartModel.findOneAndUpdate(
        {
          user: req.currentUser._id,
          "cartItems.productID": productId,
        },
        { $inc: { "cartItems.$.quantity": quantity } },
        { new: true }
      ),
      productModel.findOne({
        "allProduct.categoryOfProduct._id": productId,
      }),
    ]);

    if (!prodcut) {
      return handleError(404, "PRODUCT NOT FOUND", null, next);
    }
    if (!cart) {
      const updatedCart = await cartModel.findOneAndUpdate(
        { user: req.currentUser._id },
        {
          $addToSet: {
            cartItems: { productID: productId, quantity: quantity },
          },
        },
        { new: true, upsert: true }
      );
      return handleSuccess(
        200,
        "ITEM ADDED TO CART SUCCESSFULLY",
        updatedCart,
        next
      );
    }

    return handleSuccess(200, "QUANTITY UPDATED SUCCESSFULLY", cart, next);
  } catch (error) {
    return handleError(
      500,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
};

const viewCart = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const viewCart = await cartModel.findOne(
      { user: req.currentUser._id, "cartItems._id": req.params.id },
      { "cartItems.$": 1 }
    );
    if (!viewCart) {
      return handleSuccess(200, "NOT FOUND CART", viewCart, next);
    }
    return handleSuccess(200, "RETRIVED CART SUCCESSFULLY", viewCart, next);
  } catch (error) {
    return handleError(
      400,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const viewAllCart = MiddleWareError(async (req, res, next) => {
  try {
    const viewCart = await cartModel.findOne({ user: req.currentUser._id });
    if (!viewCart) {
      return handleSuccess(200, "NOT FOUND CART", viewCart, next);
    }
    return handleSuccess(200, "RETRIVED CART SUCCESSFULLY", viewCart, next);
  } catch (error) {
    return handleError(
      400,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const deleteCart = MiddleWareError(async (req, res, next) => {
  try {
    const cart = await cartModel.findOneAndUpdate(
      {
        user: req.currentUser._id,
        "cartItems.productID": req.params.id,
      },
      {
        $pull: { cartItems: { productID: req.params.id } },
      },
      { new: true }
    );
    if (!cart) {
      return handleError(404, "Product not found in cart", null, next);
    }
    return handleSuccess(200, "Product removed from cart", null, next);
  } catch (error) {
    return handleError(
      400,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const clearCart = MiddleWareError(async (req, res, next) => {
  try {
    const cart = await cartModel.findOneAndUpdate(
      { user: req.currentUser._id },
      {
        $set: { cartItems: [] },
      },
      { new: true }
    );
    if (!cart) {
      return handleError(404, "Cart not found", null, next);
    }
    return handleSuccess(200, "Cart cleared successfully", null, next);
  } catch (error) {
    return handleError(
      400,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

const NumberCart = MiddleWareError(async (req, res, next) => {
  try {
    const userId = req.currentUser._id;
    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return handleError(404, "Cart not found", null, next);
    }
    return handleSuccess(
      200,
      "Cart item count retrieved successfully",
      { itemCount: cart.cartItems.length },
      next
    );
  } catch (error) {
    return handleError(
      400,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

module.exports = {
  addCart,
  viewCart,
  viewAllCart,
  deleteCart,
  clearCart,
  NumberCart,
};
