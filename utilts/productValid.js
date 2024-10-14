const { body } = require("express-validator");

const validProduct = () => {
  return [
    body("name")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 10, max: 15 })
      .withMessage("at least 10 and most 15")
      .isString()
      .withMessage("should string")
      .isAlpha("en-US")
      .withMessage("Something wrong")
      .isLowercase()
      .withMessage("not allow UpperCase"),
    body("price")
      .notEmpty()
      .withMessage("is required")
      .isNumeric()
      .withMessage("not string")
      .isLength({ min: 1, max: 100000 })
      .withMessage("at least 1 and most 6"),
    body("quantity")
      .notEmpty()
      .withMessage("is required")
      .isNumeric()
      .withMessage("not string")
      .isLength({ min: 1, max: 100 })
      .withMessage("at least 1 and most 100"),
    body("description")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 10, max: 100 })
      .withMessage("at least 10 and most 100")
      .isString()
      .withMessage("should string")
      .isAlpha("en-US")
      .withMessage("Something wrong")
      .isLowercase()
      .withMessage("not allow UpperCase"),
    body("offer")
      .notEmpty()
      .withMessage("is required")
      .isNumeric()
      .withMessage("not string")
      .isLength({ min: 1, max: 1000 })
      .withMessage("at least 1 and most 1000"),
  ];
};
module.exports = validProduct;
