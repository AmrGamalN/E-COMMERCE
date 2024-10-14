const express = require("express");
const verifyToken = require("../middleware/authenticateToken");
const {
  addOrder,
  deleteOrder,
  updateOrder,
  paymentStatusChange,
  isDelivered,
  isPaid,
  orderStatus,
  orderNumber,
  getOrder,
  getAllOrder,
} = require("../controllers/orderControl");
const requireRole = require("../middleware/requireRole ");
const orderRouters = express.Router();
const validOrder = require("../utilts/OrderValid");
orderRouters.route("/addorder/:id").post(verifyToken, validOrder(), addOrder);
orderRouters.route("/orderNumber").get(verifyToken, validOrder(), orderNumber);
orderRouters.route("/getOrder/:id").get(verifyToken, validOrder(), getOrder);
orderRouters.route("/getAllOrder").get(verifyToken, validOrder(), getAllOrder);
orderRouters
  .route("/payment-status/:id")
  .post(verifyToken, validOrder(), paymentStatusChange);
orderRouters
  .route("/delivered/:id")
  .post(verifyToken, validOrder(), isDelivered);
orderRouters.route("/paid/:id").post(verifyToken, validOrder(), isPaid);
orderRouters.route("/status/:id").post(verifyToken, validOrder(), orderStatus);

orderRouters.route("/deleteOrder/:id").delete(verifyToken, deleteOrder);
orderRouters
  .route("/updateOrder/:id")
  .put(verifyToken, validOrder(), updateOrder);

module.exports = orderRouters;
