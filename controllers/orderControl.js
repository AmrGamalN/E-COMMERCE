const orderModel = require("../database/models/orderModel");
const productModel = require("../database/models/productModel");
const transactionModel = require("../database/models/transactionModel");

const MiddleWareError = require("../middleware/errorHandler");
const { validationResult } = require("express-validator");
const { handleError, handleSuccess } = require("../handleCheck/checkError");

const calculateTaxPrice = (subTotal, taxRate) => {
  if (!subTotal || subTotal <= 0) {
    throw new Error("Subtotal must be greater than zero.");
  }
  if (!taxRate || taxRate < 0) {
    throw new Error("Tax rate must be a positive number.");
  }
  const taxPrice = subTotal * taxRate;
  return parseFloat(taxPrice.toFixed(2));
};

const addOrder = MiddleWareError(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleError(400, "FAIL", errors.array(), next);
    }

    const {
      fullName,
      quantity,
      address,
      city,
      country,
      postalCode,
      phone,
      anotherAddress,
      apartment,
      building,
      paymentMethod,
    } = req.body;

    // Find the product
    const productId = req.params.id;
    const foundProduct = await productModel.findOne({
      "allProduct.categoryOfProduct": {
        $elemMatch: { _id: productId },
      },
    });
    const targetProduct = foundProduct.allProduct.find((product) =>
      product.categoryOfProduct.some((cat) => cat._id.equals(productId))
    );

    for (let i in targetProduct.categoryOfProduct) {
      // Compare the ObjectId correctly
      if (targetProduct.categoryOfProduct[i]._id.equals(productId)) {
        //info of user
        const userId = req.currentUser._id;

        // Calculate prices
        const productID = targetProduct.categoryOfProduct[i]._id;
        const productName = targetProduct.categoryOfProduct[i].productName;
        const Quantity = quantity;
        const price = targetProduct.categoryOfProduct[i].price;
        const discount = targetProduct.categoryOfProduct[i].discount;
        const shippingPrice = process.env.shippingprice;
        const subtotal = targetProduct.categoryOfProduct[i].price * quantity;
        const taxPrice = calculateTaxPrice(
          subtotal,
          targetProduct.categoryOfProduct[i].taxPrice
        );
        const totalPrice =
          subtotal + taxPrice + Number(shippingPrice) - discount;

        // Order details to be inserted
        const orderDetails = {
          orderItems: {
            product: productID,
            productName: productName,
            quantity: Quantity,
            uintPrice: price,
            discount: discount,
            taxPrice: targetProduct.categoryOfProduct[i].taxPrice,
            totalPrice: totalPrice,
          },
          shippingAddress: {
            fullName: fullName,
            address: address,
            city: city,
            country: country,
            postalCode: postalCode,
            phone: phone,
            apartment: apartment,
            building: building,
            anotherAddress: anotherAddress,
          },
          PriceItems: {
            subtotal: subtotal,
            shippingPrice: shippingPrice,
            taxPrice: taxPrice,
            totalPrice: totalPrice,
          },
          transactionItems: {
            paymentMethod: paymentMethod,
            amountPrice: totalPrice,
          },
        };

        // Check if the order already contains the product
        const existingOrder = await orderModel.findOne({
          user: req.currentUser._id,
          "order.orderItems.product": productId, // Check if this product already exists
        });

        if (existingOrder) {
          return handleError(
            400,
            "FAIL",
            "Product already exists in the order",
            next
          );
        }

        // Insert or update the order for the current user
        // Populate the user details in the order
        const populateProductInorder = await orderModel
          .findOneAndUpdate(
            { user: userId },
            {
              $addToSet: {
                order: orderDetails,
              },
            },
            { upsert: true, new: true }
          )
          .populate("user");

        populateProductInorder.numberOrder =
          populateProductInorder.order.length;
        await populateProductInorder.save();

        const newOrderId =
          populateProductInorder.order[populateProductInorder.order.length - 1];

        const transactionDetails = {
          order_id: newOrderId._id,
          amountPrice: newOrderId.PriceItems.totalPrice,
          paymentStatus: newOrderId.transactionItems.paymentStatus,
          paymentMethod: newOrderId.transactionItems.paymentMethod,
          orderStatus: newOrderId.transactionItems.orderStatus,
          created_at: newOrderId.createdAt,
          updated_at: newOrderId.updatedAt,
          currency: newOrderId.transactionItems.currency,
        };

        await transactionModel.findOneAndUpdate(
          {
            user: req.currentUser._id,
          },
          {
            $addToSet: {
              transaction: transactionDetails,
            },
          },
          {
            upsert: true,
            new: true,
          }
        );

        // Return success response
        return handleSuccess(
          200,
          "created successfully",
          populateProductInorder,
          next
        );
      }
    }
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const deleteOrder = MiddleWareError(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    // Find the user and pull the order with the given orderId
    const updatedOrder = await orderModel.findOneAndUpdate(
      { user: req.currentUser._id },
      {
        $pull: { order: { _id: orderId } }, // Removes the specific order item from the array
      },
      { new: true }
    );

    // If no order was found
    if (updatedOrder.order.length === 0) {
      return handleError(400, "Not found Order", null, next);
    }

    // Return success message, optionally showing the remaining orders
    return handleSuccess(
      200,
      `Order of product ${updatedOrder.order
        .map((prod) => prod.orderItems.productName)
        .join(", ")} deleted successfully`,
      updatedOrder, // You can return the updated order document if needed
      next
    );
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const updateOrder = MiddleWareError(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleError(400, "FAIL", errors.array(), next);
    }
    const orderId = req.params.id;
    const {
      quantity,
      address,
      city,
      country,
      postalCode,
      phone,
      anotherAddress,
      fullName,
      paymentMethod,
    } = req.body;

    // Find the user and pull the order with the given orderId
    const findOrder = await orderModel.findOne({
      user: req.currentUser._id,
      "order._id": orderId,
    });

    // If no matching order is found
    if (!findOrder) {
      return handleError(400, "Order not found", null, next);
    }

    // Calculate New prices
    const orderDetails = findOrder.order.map((prod) => [
      prod.orderItems.uintPrice,
      prod.orderItems.discount,
      prod.orderItems.taxPrice,
    ]);
    const price = orderDetails[0][0];
    const discount = orderDetails[0][1];
    const shippingPrice = process.env.shippingprice;
    const subtotal = price * quantity;
    const taxPrice = calculateTaxPrice(subtotal, orderDetails[0][2]);
    const totalPrice = subtotal + taxPrice + Number(shippingPrice) - discount;

    // Find the order and update the specific order item by its _id
    const updatedOrder = await orderModel.findOneAndUpdate(
      { user: req.currentUser._id, "order._id": orderId },
      {
        $set: {
          "order.$.orderItems": {
            quantity,
            price,
            discount,
            totalPrice,
          },
          "order.$.shippingAddress": {
            fullName,
            address,
            city,
            country,
            postalCode,
            phone,
            anotherAddress,
          },
          "order.$.paymentMethod": paymentMethod,
        },
      },
      { upsert: true, new: true }
    );
    const updatedOrderInfo = updatedOrder.order.find((prod) =>
      prod._id.equals(orderId)
    );
    return handleSuccess(200, `success`, updatedOrderInfo, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const paymentStatusChange = MiddleWareError(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { paymentStatus } = req.body;
    const order = await orderModel.findOneAndUpdate(
      {
        user: req.currentUser._id,
        "order._id": orderId,
      },
      {
        $set: {
          "order.$.paymentStatus": paymentStatus,
          "order.$.paymentResult": {
            id: req.currentUser._id,
            status: paymentStatus,
            updateTime: Date.now(),
            emailAddress: req.currentUser.email,
          },
        },
      },
      { upsert: true, new: true }
    );
    const getOrderUpdate = order.order.find((prod) => prod._id.equals(orderId));
    return handleSuccess(200, `success`, getOrderUpdate, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const isDelivered = MiddleWareError(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { isDelivered } = req.body;
    const order = await orderModel.findOneAndUpdate(
      {
        user: req.currentUser._id,
        "order._id": orderId,
      },
      {
        $set: {
          "order.$.isDelivered": isDelivered,
          "order.$.deliveredAt": Date.now(),
        },
      },
      { upsert: true, new: true }
    );
    const getOrderUpdate = order.order.find((prod) => prod._id.equals(orderId));
    return handleSuccess(200, `success`, getOrderUpdate, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const isPaid = MiddleWareError(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { isPaid } = req.body;
    const order = await orderModel.findOneAndUpdate(
      {
        user: req.currentUser._id,
        "order._id": orderId,
      },
      {
        $set: {
          "order.$.isPaid": isPaid,
          "order.$.paidAt": Date.now(),
        },
      },
      { upsert: true, new: true }
    );
    const getOrderUpdate = order.order.find((prod) => prod._id.equals(orderId));
    return handleSuccess(200, `success`, getOrderUpdate, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const orderStatus = MiddleWareError(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { orderStatus } = req.body;
    const order = await orderModel.findOneAndUpdate(
      {
        user: req.currentUser._id,
        "order._id": orderId,
      },
      {
        $set: {
          "order.$.orderStatus": orderStatus,
        },
      },
      { upsert: true, new: true }
    );
    const getOrderUpdate = order.order.find((prod) => prod._id.equals(orderId));
    return handleSuccess(200, `success`, getOrderUpdate, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const orderNumber = MiddleWareError(async (req, res, next) => {
  try {
    const order = await orderModel.findOne({
      user: req.currentUser._id,
    });
    if (!order) {
      return handleError(404, "not found order", null, next);
    }
    return handleSuccess(
      200,
      `success`,
      `number of order ${order.order.length}`,
      next
    );
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const getOrder = MiddleWareError(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel.findOne({
      user: req.currentUser._id,
      "order._id": orderId,
    });
    if (!order) {
      return handleError(404, "not found order", null, next);
    }
    const tardetOrder = order.order.find((prod) => prod._id.equals(orderId));
    return handleSuccess(200, `success`, tardetOrder, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

const getAllOrder = MiddleWareError(async (req, res, next) => {
  try {
    const order = await orderModel.find({});
    if (!order) {
      return handleError(404, "not found order", null, next);
    }
    return handleSuccess(200, `success`, order, next);
  } catch (error) {
    return handleError(500, "INTERNAL SERVER ERROR", error, next);
  }
});

module.exports = {
  addOrder,
  getOrder,
  getAllOrder,
  deleteOrder,
  updateOrder,
  paymentStatusChange,
  isDelivered,
  isPaid,
  orderStatus,
  orderNumber,
};
