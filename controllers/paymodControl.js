const axios = require("axios");
const orderModel = require("../database/models/orderModel");
const { handleError, handleSuccess } = require("../handleCheck/checkError");
const MiddleWareError = require("../middleware/errorHandler");
const transactionModel = require("../database/models/transactionModel");
const { decryptTransactionId } = require("../crypto/bcryptHashPassword");
const { validationResult } = require("express-validator");
const authenticate = require("../database/redis_connection");
// Environment variables
const {
  PAYMOB_AUTHNTICATION_URL: paymobAuthUrl,
  PAYMOB_CREATE_ORDER_URL: paymobOrderUrl,
  PAYMOB_PAYMENT_KEY_URL: paymobPaymentKeyUrl,
  PAYMOB_REFUND_URL: paymobRefundUrl,
  PAYMOB_TRRANSACTION_INQUIRY_URL: paymobTransactionInquiryUrl,
  PAYMOB_IFRAME_ID: iframeId,
  PAYMOB_API_KEY: apiKey,
  PAYMOB_INTEGRATION_ID: integrationId,
  EXPIRE_PAYMOB: expirePaymob,
} = process.env;

// authenticate()
//   .then((token) => {
//     console.log("Authenticated token:", token);
//   })
//   .catch((error) => {
//     console.error("Error:", error.message);
//   });

// Function validation
const valid = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleError(400, "VALIDATION FAILED", errors.array(), next);
  }
};

// Function to update orderstatus and paymentStatus
const paymentStatus_orderStatus = async (
  transaction_id,
  order_id,
  paymentStatus,
  orderStatus
) => {
  try {
    const [transaction, order] = await Promise.all([
      transactionModel.findOneAndUpdate(
        { "transaction.order_id": order_id },
        {
          $set: {
            "transaction.$.paymentStatus": paymentStatus,
            "transaction.$.orderStatus": orderStatus,
            "transaction.$.order_id": order_id,
          },
        }
      ),
      orderModel.findOneAndUpdate(
        { "order._id": order_id },
        {
          $set: {
            "order.$.transactionItems.paymentStatus": paymentStatus,
            "order.$.transactionItems.orderStatus": orderStatus,
            "order.$.transactionItems.order_id": order_id,
          },
        }
      ),
    ]);
    return {
      transaction,
      order,
    };
  } catch (error) {
    return handleError(404, `${error}`, null, next);
  }
};

// Create order paymob
const createPaymentUrl = MiddleWareError(async (req, res, next) => {
  try {
    const order_id = req.params.order_id;
    const decryptOrderID = decryptTransactionId(order_id);
    const auth_token = await authenticate(); //caching
    const [order] = await Promise.all([
      orderModel.findOne(
        {
          "order._id": decryptOrderID,
        },
        {
          "order.$": 1,
        }
      ),
    ]);

    if (!order) {
      return handleError(404, `ORDER ${decryptOrderID} NOT FOUND.`, null, next);
    }

    const targetTansaction = order.order[0].transactionItems;
    const targetPrice = order.order[0].PriceItems;
    const targetaddress = order.order[0].shippingAddress;

    const orderResponse = await axios.post(paymobOrderUrl, {
      auth_token: auth_token,
      delivery_needed: false,
      amount_cents: targetPrice.totalPrice * 100, // Price in cents
      currency: targetTansaction.currency,
      items: [],
    });

    if (!orderResponse.data.id) {
      return handleError(500, "FAILED TO CREATE ORDER WITH PAYMOB", null, next);
    }

    // Generate payment key
    const paymentKeyResponse = await axios.post(paymobPaymentKeyUrl, {
      auth_token: auth_token,
      amount_cents: orderResponse.data.amount_cents,
      expiration: expirePaymob,
      order_id: orderResponse.data.id,
      billing_data: {
        apartment: targetaddress.apartment || "N/A",
        email: req.currentUser.email,
        floor: targetaddress.floor || "N/A",
        first_name: req.currentUser.fname,
        last_name: req.currentUser.lname,
        street: targetaddress.address,
        building: targetaddress.building || "N/A",
        phone_number: targetaddress.phone,
        postal_code: targetaddress.postalCode,
        city: targetaddress.city,
        country: targetaddress.country,
        state: targetaddress.state,
      },
      currency: targetTansaction.currency,
      integration_id: integrationId,
    });

    if (!paymentKeyResponse.data.token) {
      return handleError(
        500,
        "FAILED TO GENERATE PAYKEY WITH PAYMOB",
        null,
        next
      );
    }

    const paymentUrl = `https://accept.paymobsolutions.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKeyResponse.data.token}`;
    // res.redirect(paymentUrl);
    return handleSuccess(
      200,
      "SUCCESSFULLY TO PAYMENT PAGE SECURELY",
      paymentUrl,
      next
    );
  } catch (error) {
    return handleError(
      500,
      "ERROR CREATING ORDER WITH PAYMOB",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

// Update transaction
const update_transaction = MiddleWareError(async (req, res, next) => {
  try {
    const newData = req.params.data;
    const decrypted = decryptTransactionId(newData);
    const data = JSON.parse(decodeURIComponent(decrypted)); // Data is array  index = 0 = order_id  || index 1 = transaction_id
    const auth_token = await authenticate();
    const paymobTransactionInquiryResponse = await axios.get(
      `${paymobTransactionInquiryUrl}${data[1]}`,
      {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      }
    );

    // Check if the response exists and contains the data
    if (
      paymobTransactionInquiryResponse &&
      paymobTransactionInquiryResponse.data &&
      paymobTransactionInquiryResponse.data.success === true
    ) {
      const [transaction, order] = paymentStatus_orderStatus(
        data[1],
        data[0],
        paymobTransactionInquiryResponse.data.status,
        "Pending"
      );

      if (!transaction || !order) {
        return handleError(404, `TRANSACTION OR ORDER NOT FOUND.`, null, next);
      }

      return handleSuccess(
        200,
        "TANSACTION UPDATE IS successful",
        ` ${paymobTransactionInquiryResponse.data} AND ${paymobTransactionInquiryResponse.data}`,
        null,
        next
      );
    } else {
      paymentStatus_orderStatus(
        data[1],
        data[0],
        paymobTransactionInquiryResponse.data.status,
        "Failed"
      );
      return handleError(
        500,
        "FAILED TO UPDATE",
        paymobTransactionInquiryResponse.data,
        next
      );
    }
  } catch (error) {
    return handleError(
      400,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

// Inquiry transaction
const inquiry_transaction = MiddleWareError(async (req, res, next) => {
  try {
    const transaction_id = req.params.transaction_id;
    const decryptedTransactionId = decryptTransactionId(transaction_id);
    const query = { "transaction.order_id": decryptedTransactionId };
    if (req.currentUser.role === "USER") {
      // The administrator can query any user but the user can query himself.
      query.user = req.currentUser._id;
    }

    const [auth_token, transaction] = await Promise.race([
      authenticate(),
      transactionModel.findOne(query, {
        "transaction.$": 1,
      }),
    ]);

    if (!transaction || auth_token) {
      return handleError(404, `TRANSACTION OR TOKEN NOT FOUND.`, null, next);
    }

    // Using this code when using paymob actually
    const paymobTransactionInquiryResponse = await axios.get(
      `${paymobTransactionInquiryUrl}${transaction_id}`,
      {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      }
    );

    if (
      paymobTransactionInquiryResponse &&
      paymobTransactionInquiryResponse.data &&
      paymobTransactionInquiryResponse.data.success === true
    ) {
      return handleSuccess(
        200,
        "TANSACTION INQUIRY IS SUCCESSFUL",
        paymobTransactionInquiryResponse.data,
        next
      );
    } else {
      return handleError(
        400,
        "TRANSACCTION INQUIRY RESPONSE IS MISSING OR INCOMPLITE FROM ALL SOURESE.",
        paymobTransactionInquiryResponse.data.message,
        next
      );
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

// Callback tansaction
const callback_transaction = MiddleWareError(async (req, res, next) => {
  try {
    // Callback: After a user completes a payment, Paymob sends a callback request to your specified callback URL ,order_id, order_id, success, pending.
    valid(req, next);
    const { transaction_id } = req.body;
    const auth_token = await authenticate();
    const paymobCallbackResponse = await axios.get(
      `${paymobTransactionInquiryUrl}${transaction_id}`,
      {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      }
    );

    if (
      paymobCallbackResponse &&
      paymobCallbackResponse.data &&
      paymobCallbackResponse.data.success === true
    ) {
      paymentStatus_orderStatus(
        transaction_id,
        order_id,
        paymobCallbackResponse.data.status,
        "Confirmed"
      );
      return handleSuccess(
        200,
        "PAYMENT SUCCESSFULLY",
        paymobCallbackResponse.data,
        next
      );
    } else {
      paymentStatus_orderStatus(transaction_id, order_id, "Failed", "Failed");
      return handleError(
        500,
        "PAYMENT FAILED",
        refundResponse.data.status,
        next
      );
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

// Refunded tansaction
const refunded_transaction = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const auth_token = await authenticate();
    const { refundAmount, transaction_id, order_id } = req.body;
    const refundResponse = await axios.post(paymobRefundUrl, {
      auth_token: auth_token,
      transaction_id: transaction_id,
      amount_cents: refundAmount * 100,
    });

    if (
      refundResponse &&
      refundResponse.data &&
      refundResponse.data.success === true
    ) {
      paymentStatus_orderStatus(
        transaction_id,
        order_id,
        refundResponse.data.status,
        "Refunded"
      );
      return handleSuccess(
        200,
        "REFUND SUCCESSFULLY",
        refundResponse.data,
        next
      );
    } else {
      paymentStatus_orderStatus(transaction_id, order_id, "Failed", "Failed");
      return handleError(
        500,
        "REFUND FAILED",
        refundResponse.data.status,
        next
      );
    }
  } catch (error) {
    return handleError(
      400,
      "INTERNAL SERVER ERROR",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

// Find_transaction from paymob
const find_transaction_paymob = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const auth_token = await authenticate();
    const { transaction_id } = req.body;
    const response = await axios.get(
      `${paymobTransactionInquiryUrl}${transaction_id}`,
      {
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      }
    );

    if (response.data && response.status === 200) {
      return handleSuccess(
        200,
        "FIND TRANSACTION SUCCESSFULLY",
        response.data,
        next
      );
    } else {
      return handleError(
        response.status,
        "NO DATA RETUREND FROM PAYMOB",
        null,
        next
      );
    }
  } catch (error) {
    return handleError(
      400,
      "ERROR FETCHING TRANSACTION:",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

// Find all transaction from paymob
const find_all_transaction_paymob = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const auth_token = await authenticate();
    const { from, to } = req.body;
    const response = await axios.get(paymobTransactionInquiryUrl, {
      headers: {
        Authorization: `Bearer ${auth_token}`,
      },
      params: {
        from: from,
        to: to,
      },
    });

    if (response.data && response.status === 200) {
      return handleSuccess(
        200,
        `FIND ALL FROM ${from} TO ${to} TRANSACTION SUCCESSFULLY`,
        response.data,
        next
      );
    } else {
      return handleError(
        response.status,
        "NO DATA RETUREND FROM PAYMOB",
        null,
        next
      );
    }
  } catch (error) {
    return handleError(
      400,
      "ERROR FETCHING TRANSACTION",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

// Paymob does not provide a direct API or method to "delete"
// Delete transaction
const delete_transaction = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { order_id, transaction_id } = req.body;
    const [transaction, order] = await Promise.all([
      transactionModel.findOneAndUpdate(
        {
          "transaction.transaction_id": transaction_id,
        },
        {
          $pull: { transaction: { transaction_id: transaction_id } },
        }
      ),
      orderModel.findOneAndUpdate(
        { "order._id": order_id },
        {
          $pull: { order: { _id: order_id } },
        }
      ),
    ]);

    if (!order || !transaction) {
      return handleError(
        404,
        `TRANSACTION OR ORDER ${transaction_id || order_id} NOT FOUND.`,
        null,
        next
      );
    }

    return handleSuccess(
      200,
      `DELETE TRANSACTION SUCCESSFULLY`,
      order.order,
      next
    );
  } catch (error) {
    return handleError(
      400,
      "ERROR DELETING TRANSACTION",
      error.response ? error.response.data : error.message,
      next
    );
  }
});

// Failed transaction
const Failed_transaction = MiddleWareError(async (req, res, next) => {
  try {
    valid(req, next);
    const { order_id, transaction_id } = req.body;
    const { transaction, order } = await paymentStatus_orderStatus(
      order_id,
      order_id,
      "Failed",
      "Failed"
    );

    if (!order || !transaction) {
      return handleError(
        404,
        `TRANSACTION OR ORDER ${transaction_id || order_id} NOT FOUND.`,
        null,
        next
      );
    }

    return handleSuccess(
      200,
      `FAILED TRANSACTION UPDATED SUCCESSFULLY`,
      transaction,
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

// All number transaction
const all_number_transaction = MiddleWareError(async (req, res, next) => {
  try {
    const transactionNumber = (await transactionModel.distinct("transaction"))
      .length;

    if (!transactionNumber === 0) {
      return handleError(404, `TRANSACTION NOT FOUND.`, null, next);
    }
    return handleSuccess(
      200,
      `TRANSACTION NUMBER ${transactionNumber} `,
      transactionNumber,
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

// User number transaction
const user_transaction_number = MiddleWareError(async (req, res, next) => {
  try {
    const { userID } = req.body;
    const transactionNumber = await transactionModel.findOne({ user: userID });
    if (!transactionNumber === 0) {
      return handleError(404, `TRANSACTION NOT FOUND.`, null, next);
    }
    return handleSuccess(
      200,
      `TRANSACTION NUMBER FOR USER '${req.currentUser.fname} ${req.currentUser.lname}' IS ${transactionNumber.transaction.length} `,
      transactionNumber.transaction.length,
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
};
