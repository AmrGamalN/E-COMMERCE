const { body, check } = require("express-validator");

const validCategory = () => {
  return [
    check("categoryName")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("at least 10 and most 20")
      .isString()
      .withMessage("should string")
      .isAlpha("en-US")
      .withMessage("Something wrong")
      .isLowercase()
      .withMessage("not allow UpperCase"),
    // body("categoryImage").notEmpty().withMessage("is required"),
  ];
};
module.exports = validCategory;
