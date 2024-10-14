const { body } = require("express-validator");

const validPage = () => {
  return [
    body("title")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("at least 10 and most 20")
      .isString()
      .withMessage("should string")
      .isAlpha("en-US")
      .withMessage("Something wrong"),
    body("description")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("at least 10 and most 100")
      .isString()
      .withMessage("should string")
      .isAlpha("en-US")
      .withMessage("Something wrong"),
  ];
};
module.exports = validPage;
