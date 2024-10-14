const { body, check } = require("express-validator");

const validOrder = () => {
  return [
    check("fullName")
      .not()
      .isNumeric()
      .withMessage("Name cannot contain numbers")
      .notEmpty()
      .withMessage("is required")
      .isString()
      .withMessage("invalid value")
      .isLength({ min: 3, max: 25 })
      .withMessage("at least 5 and most 15"),
    check("quantity")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 1, max: 10 })
      .withMessage("at least 10 and most 20")
      .isNumeric()
      .withMessage("not string"),
    check("address")
      .notEmpty()
      .withMessage("is required")
      .isString()
      .withMessage("invalid value")
      .isLength({ min: 3, max: 50 })
      .withMessage("at least 10 and most 50"),
    check("apartment")
      .notEmpty()
      .withMessage("is required")
      .isNumeric("en-US")
      .withMessage("not string")
      .isLength({ min: 1, max: 1000 })
      .withMessage("at least 5 and most 7"),
    check("building")
      .notEmpty()
      .withMessage("is required")
      .isNumeric("en-US")
      .withMessage("not string")
      .isLength({ min: 1, max: 1000 })
      .withMessage("at least 5 and most 7"),
    check("city")
      .notEmpty()
      .withMessage("is required")
      .isAlpha()
      .withMessage("invalid value")
      .isLength({ min: 3, max: 15 })
      .withMessage("at least 5 and most 15"),
    check("country")
      .notEmpty()
      .withMessage("is required")
      .isString()
      .isAlpha()
      .withMessage("invalid value")
      .isLength({ min: 3, max: 15 })
      .withMessage("at least 5 and most 15"),
    check("postalCode")
      .notEmpty()
      .withMessage("is required")
      .isNumeric("en-US")
      .withMessage("not string")
      .isLength({ min: 5, max: 7 })
      .withMessage("at least 5 and most 7"),
    check("phone")
      .isMobilePhone("ar-EG")
      .withMessage("invailed phone number")
      .isNumeric()
      .withMessage("not numder")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 11, max: 11 })
      .withMessage("invalid phone number"),
    check("anotherAddress")
      .notEmpty()
      .withMessage("is required")
      .isString()
      .withMessage("invalid value")
      .isLength({ min: 3, max: 50 })
      .withMessage("at least 10 and most 50"),
    check("paymentMethod")
      .notEmpty()
      .withMessage("is required")
      .matches(/^\s*(PayPal|Credit Card|Debit Card|Cash on Delivery)\s*$/i)
      .withMessage("invalid value"),
  ];
};

module.exports = validOrder;
