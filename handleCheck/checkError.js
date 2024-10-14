const userError = require("./objectHandleError");

// Helper function to handle error responses
const handleError = (status, message, error, next) => {
  const err = userError.create("FAIL", status, "BADREQUEST", message, error);
  if (typeof next === "function") {
    return next(err);
  }
  console.log(err);
};

// Helper function to handle success responses
const handleSuccess = (status, message, data, next) => {
  const err = userError.create("SUCCESS", status, "OK", message, data);
  if (typeof next === "function") {
    return next(err); // Call next if it's a function
  }
  // Log success response if needed or handle it differently
  console.log(err);
};

// Helper function to check required fields
const checkRequiredFields = (fields, next) => {
  const missingFields = fields.filter((field) => !field.value);
  if (missingFields.length) {
    return handleError(
      400,
      "FAIL",
      `${missingFields.join(", ")} are required.`,
      next
    );
  }
};

module.exports = { handleError, handleSuccess, checkRequiredFields };
