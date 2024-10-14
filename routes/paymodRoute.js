const {
  createPaymentUrl,
  update_transaction,
  inquiry_transaction,
  callback_transaction,
  refunded_transaction,
  find_transaction_paymob,
  find_all_transaction_paymob,
  delete_transaction,
  Failed_transaction,
  all_number_transaction,
  user_transaction_number,
} = require("../controllers/paymodControl");
const verifyToken = require("../middleware/authenticateToken");
const { requireRole, Forbidden } = require("../middleware/requireRole ");
const { encryptTransactionId } = require("../crypto/bcryptHashPassword");
const {
  createOrderValid,
  transactionValid,
  orderValid,
  refundValid,
  findAllTransactionValid,
  userValid,
} = require("../utilts/transactionValid");
const { handleError } = require("../handleCheck/checkError");
const { validationResult } = require("express-validator");

const express = require("express");
const paymobRouters = express.Router();

// Function validation
const valid = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleError(400, "FAIL", errors.array(), next);
  }
};

// Create order paymob
paymobRouters
  .route("/Payment_process")
  .post(verifyToken, createOrderValid(), async (req, res, next) => {
    try {
      valid(req);
      const { order_id } = req.body;
      const encryptOrderID = encryptTransactionId(order_id);
      const newUrl = `http://localhost:3000/api/pay/Payment_process/${encryptOrderID}`;
      res.redirect(newUrl);
    } catch (error) {
      next(error);
    }
  });
paymobRouters
  .route("/Payment_process/:order_id")
  .get(verifyToken, Forbidden(["ADMIN", "USER"]), createPaymentUrl);

// Update tansaction
paymobRouters
  .route(`/admin/transaction_update`)
  .post(
    verifyToken,
    requireRole("ADMIN"),
    transactionValid(),
    orderValid(),
    async (req, res, next) => {
      try {
        valid(req);
        const newData = [req.body.order_id, req.body.transaction_id];
        const encryptTransactionID = encodeURIComponent(
          JSON.stringify(newData)
        );
        const data = encryptTransactionId(encryptTransactionID);
        const newUrl = `http://localhost:3000/api/pay/admin/transaction/transaction_update/${data}`;
        res.redirect(302, newUrl);
      } catch (error) {
        next(error);
      }
    }
  );
paymobRouters
  .route(`/admin/transaction/transaction_update/:data`)
  .get(verifyToken, requireRole("ADMIN"), update_transaction);

// Inquiry tansaction
paymobRouters
  .route(`/transaction/transaction_inquiry`)
  .post(
    verifyToken,
    Forbidden(["ADMIN", "USER"]),
    transactionValid(),
    async (req, res, next) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return handleError(400, "FAIL", errors.array(), next);
        }
        const { transaction_id } = req.body;
        const encryptTransactionID = encryptTransactionId(transaction_id);
        const newUrl = `http://localhost:3000/api/pay/transaction/transaction_inquiry/${encryptTransactionID}`;
        res.redirect(302, newUrl);
      } catch (error) {
        next(error);
      }
    }
  );
paymobRouters
  .route("/transaction/transaction_inquiry/:transaction_id")
  .get(verifyToken, Forbidden(["ADMIN", "USER"]), inquiry_transaction);

// Callback tansaction  || Automatic callback after payment
paymobRouters
  .route("/payment_callback")
  .get(
    verifyToken,
    Forbidden(["ADMIN", "USER"]),
    transactionValid(),
    callback_transaction
  );

// Refunded tansaction
paymobRouters
  .route("/admin/refunded")
  .post(verifyToken, requireRole("ADMIN"), refundValid(), refunded_transaction);

// Find tansaction
paymobRouters
  .route("/admin/find_transaction")
  .get(
    verifyToken,
    requireRole("ADMIN"),
    transactionValid(),
    find_transaction_paymob
  );

// Find all transaction
paymobRouters
  .route("/admin/find_all_transaction")
  .get(
    verifyToken,
    requireRole("ADMIN"),
    findAllTransactionValid(),
    find_all_transaction_paymob
  );

// Delete all transaction
paymobRouters
  .route("/admin/delete_transaction")
  .delete(
    verifyToken,
    requireRole("ADMIN"),
    transactionValid(),
    orderValid(),
    delete_transaction
  );

// Failed all transaction
paymobRouters
  .route("/admin/fail_transaction")
  .post(
    verifyToken,
    requireRole("ADMIN"),
    transactionValid(),
    orderValid(),
    Failed_transaction
  );

// All number transaction
paymobRouters
  .route("/admin/number_transaction")
  .get(verifyToken, requireRole("ADMIN"), all_number_transaction);

// All number transaction
paymobRouters
  .route("/admin/user_number_transaction")
  .get(verifyToken, requireRole("ADMIN"), userValid(), user_transaction_number);

module.exports = paymobRouters;
