const { body, check } = require("express-validator");

const validReview = () => {
  return [
    check("rating")
      .isNumeric()
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 1, max: 5 })
      .withMessage("at least 1 and most 5"),
    check("comment")
      .notEmpty()
      .withMessage("is required")
      .isString()
      .withMessage("invalid value")
      .isLength({ min: 3, max: 500 })
      .withMessage("at least 10 and most 50"),
  ];
};

module.exports = validReview;
