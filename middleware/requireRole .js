const { handleError } = require("../handleCheck/checkError");

// admin or user
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.currentUser.role !== role) {
      return handleError(
        403,
        "FAIL",
        "Access denied. You do not have the required role.",
        next
      );
    }
    return next();
  };
};

// is not admin or  not user
const Forbidden = (role) => {
  return (req, res, next) => {
    if (!role.includes(req.currentUser.role)) {
      console.log("not found");
      return handleError(403, "FAIL", "FORBIDDEN", next);
    }
    return next();
  };
};

// is not admin or  not user || this function to user is login not user record in token
const ForbiddenLoginUser = (role) => {
  return (req, res, next) => {
    if (!role.includes(req.current.role)) {
      return handleError(403, "FAIL", "FORBIDDEN", next);
    }
  };
};

module.exports = { requireRole, Forbidden, ForbiddenLoginUser };
