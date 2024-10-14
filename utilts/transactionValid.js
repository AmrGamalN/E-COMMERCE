const { check } = require("express-validator");

// Create order paymob valid
const createOrderValid = () => {
  return [
    check("order_id")
      .notEmpty()
      .withMessage("is required")
      .isMongoId()
      .withMessage("invalid value"),
  ];
};

// transaction_id valid
const transactionValid = () => {
  return [
    check("transaction_id")
      .notEmpty()
      .withMessage("is required")
      .isInt()
      .isLength({ max: 10, min: 10 })
      .withMessage("invalid value"),
  ];
};

// order_id valid
const orderValid = () => {
  return [
    check("order_id")
      .notEmpty()
      .withMessage("is required")
      .isMongoId()
      // .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage("invalid value"),
  ];
};

// Refund tansaction
const refundValid = () => {
  return [
    check("transaction_id")
      .notEmpty()
      .withMessage("is required")
      .isInt()
      .isLength({ max: 10, min: 10 })
      .withMessage("invalid value"),
    check("order_id")
      .notEmpty()
      .withMessage("is required")
      .isMongoId()
      .withMessage("invalid value"),
    check("refundAmount")
      .notEmpty()
      .withMessage("is required")
      .isInt()
      .withMessage("invalid value"),
  ];
};

// Find all transaction
// Refund tansaction
const findAllTransactionValid = () => {
  return [
    check("from")
      .notEmpty()
      .withMessage("is required")
      .isISO8601()
      .withMessage("From date must be format (YYYY-MM-DD)")
      .custom((value, { req }) => {
        const fromDate = new Date(value);
        const toDate = new Date(req.body.to);
        if (toDate > fromDate) {
          throw new Error(" 'from' date must be equal to or before 'to' date");
        }
        return true;
      }),
    check("to")
      .notEmpty()
      .withMessage("is required")
      .isISO8601()
      .withMessage("From date must be format (YYYY-MM-DD)")
      .custom((value, { req }) => {
        const fromDate = new Date(req.body.from);
        const toDate = new Date(value);
        if (toDate < fromDate) {
          throw new Error(" 'To' date must be equal to or after 'From' date");
        }
        return true;
      }),
  ];
};

// userID valid
const userValid = () => {
  return [
    check("userID")
      .notEmpty()
      .withMessage("is required")
      .isMongoId()
      .withMessage("invalid value"),
  ];
};

module.exports = {
  createOrderValid,
  transactionValid,
  orderValid,
  refundValid,
  findAllTransactionValid,
  userValid,
};

// Cache: استخدم التخزين المؤقت (مثل Redis) للاحتفاظ بالمعلومات التي لا تتغير كثيرًا، مثل مفاتيح
// Batching: حاول تجميع الطلبات أو إرسال البيانات بشكل مجمع بدلاً من استدعاء كل عملية على حدة.
// المشكلة: استخدام findOneAndUpdate عدة مرات قد يؤدي إلى بطء، خاصة مع زيادة حجم البيانات.
// استخدم مكتبة ضغط البيانات (مثل gzip أو Brotli) إذا كانت الخدمة الخارجية تدعم ذلك.
//استخدم Memoization أو التخزين المؤقت لنتائج العمليات المتكررة.
//استخدم عملية batch update عند الإمكان لتقليل عدد الاستعلامات.
