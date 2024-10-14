const cartController = require("../controllers/cartControl");
const verifyToken = require("../middleware/authenticateToken");
const validCart = require("../utilts/cartValid");
const roleMiddleware = require("../middleware/requireRole ");
const userValidator = require("../utilts/userValid");

const express = require("express");
const cartRouters = express.Router();

const cartRoutes = [
  {
    method: "post",
    path: "/addCart/:id",
    handler: [
      verifyToken,
      validCart(),
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      cartController.addCart,
    ],
  },
  {
    method: "get",
    path: "/viewCart/:id",
    handler: [
      verifyToken,
      userValidator.validId(),
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      cartController.viewCart,
    ],
  },
  {
    method: "get",
    path: "/viewAllCart",
    handler: [
      verifyToken,
      userValidator.validId(),
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      cartController.viewAllCart,
    ],
  },
  {
    method: "delete",
    path: "/deleteCart/:id",
    handler: [
      verifyToken,
      userValidator.validId(),
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      cartController.deleteCart,
    ],
  },
  {
    method: "delete",
    path: "/clearCart",
    handler: [
      verifyToken,
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      cartController.clearCart,
    ],
  },
  {
    method: "get",
    path: "/NumberCart",
    handler: [
      verifyToken,
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      cartController.NumberCart,
    ],
  },
];

cartRoutes.forEach((route) => {
  cartRouters[route.method](route.path, ...route.handler);
});

module.exports = cartRouters;
