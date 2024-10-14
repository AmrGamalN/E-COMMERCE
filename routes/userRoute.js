const express = require("express");
const userRouters = express.Router();
const adminRouters = express.Router();
const userController = require("../controllers/userControl");
const userValidator = require("../utilts/userValid");
const roleMiddleware = require("../middleware/requireRole ");
const verifyToken = require("../middleware/authenticateToken");
const deleteImageAfterTime = require("../modules/deleteImageAfterTime");

// User Routes
const userRoutes = [
  {
    method: "post",
    path: "/signup",
    handler: [userValidator.validSign(), userController.register],
  },
  {
    method: "post",
    path: "/login",
    handler: [
      userValidator.validLogin(),
      userController.login,
      roleMiddleware.ForbiddenLoginUser(["ADMIN", "USER"]),
    ],
  },
  {
    method: "post",
    path: "/confrimByEmail",
    handler: [
      userValidator.validEmail(),
      userValidator.validToken(),
      userController.confrimByEmail,
    ],
  },
  {
    method: "post",
    path: "/confrimByPhone",
    handler: [
      userValidator.validPhone(),
      userValidator.validOTP(),
      userController.confrimByPhone,
    ],
  },
  {
    method: "post",
    path: "/resendVeirfyCodeToEmail",
    handler: [
      userValidator.validEmail(),
      userController.resendVeirfyCodeToEmail,
    ],
  },
  {
    method: "post",
    path: "/resendVeirfyCodeToPhone",
    handler: [
      userValidator.validPhone(),
      userController.resendVeirfyCodeToPhone,
    ],
  },
  {
    method: "post",
    path: "/changePassword",
    handler: [
      verifyToken,
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      userValidator.validPassword(),
      userController.changePassword,
    ],
  },
  {
    method: "post",
    path: "/forgetPasswordAndGetByEmail",
    handler: [
      userValidator.validEmail(),
      userController.forgetPasswordAndGetByEmail,
    ],
  },
  {
    method: "post",
    path: "/forgetEmailPasswordAndGetByPhone",
    handler: [
      userValidator.validPhone(),
      userController.forgetPasswordAndGetByPhone,
    ],
  },
  {
    method: "post",
    path: "/forgetPasswordAndCheckCodeFromPhone",
    handler: [
      userValidator.validPhone(),
      userValidator.validOTP(),
      userController.forgetPasswordAndCheckCodeFromPhone,
    ],
  },
  {
    method: "post",
    path: "/forgetPasswordAndCheckCodeFromEmail",
    handler: [
      userValidator.validEmail(),
      userValidator.validOTP(),
      userController.forgetPasswordAndCheckCodeFromEmail,
    ],
  },
  {
    method: "post",
    path: "/resetPassword",
    handler: [
      userValidator.validEmail(),
      userValidator.validPassword(),
      userController.resetPassword,
    ],
  },
  {
    method: "post",
    path: "/upload",
    handler: [verifyToken, userController.uploadImage, deleteImageAfterTime],
  },
  {
    method: "get",
    path: "/logout",
    handler: [
      verifyToken,
      roleMiddleware.Forbidden(["ADMIN", "USER"]),
      userController.logout,
    ],
  },
];
userRoutes.forEach((route) => {
  userRouters[route.method](route.path, ...route.handler);
});

// Admin Routes
const adminRoutes = [
  {
    method: "get",
    path: `${process.env.ADMIN}getAllUser`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userController.getAllUser,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}getUserBYId`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userValidator.validId(),
      userController.getUserBYId,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}getUserBYPhone`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userValidator.validPhone(),
      userController.getUserBYPhone,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}searchByName`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userValidator.validName(),
      userController.searchByName,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}deleteUser/:id`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userValidator.validId(),
      userController.deleteUser,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}block/:id`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userController.blockUser,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}activeUser/:id`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userController.activeUser,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}sortByName`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userController.sortByName,
    ],
  },
  {
    method: "get",
    path: `${process.env.ADMIN}numberUserActive`,
    handler: [
      verifyToken,
      roleMiddleware.requireRole("ADMIN"),
      userController.numberUserActive,
    ],
  },
];
adminRoutes.forEach((route) => {
  adminRouters[route.method](route.path, ...route.handler);
});

// Download File
userRouters.route("/download").get(verifyToken, (req, res) => {
  res.render("download");
});
userRouters.route("/download_file").get(verifyToken, (req, res) => {
  res.download("./uploads/Document.pdf");
});
module.exports = { userRouters, adminRouters };
