const { body, check } = require("express-validator");

const validCart = () => {
  return [
    body("quantity")
      .isInt({ min: 1, max: 20 })
      .withMessage("Quantity must be an integer between 1 and 100"),
  ];
};

module.exports = validCart;
