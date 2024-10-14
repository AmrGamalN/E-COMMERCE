const MiddleWareError = require("../middleware/errorHandler");
const userModel = require("../database/models/userModel");
const ActiveUserModel = require("../database/models/activeUserModel");
const { handleError } = require("../handleCheck/checkError");
const cron = require("node-cron");

const autoLogOut = MiddleWareError(async (req, res, next) => {
  try {
    const userSession = await ActiveUserModel.findOne({
      user: req.user._id,
    });

    if (!userSession) {
      return handleError(404, "USER SEEION NOT FOUND", null, next);
    }
    const currentTime = Date.now();
    const sessionExpiration = userSession.exp * 1000;
    if (currentTime >= sessionExpiration) {
      await Promise.race([
        userModel.updateOne(userSession.user, {
          $set: { isActive: false },
        }),
        ActiveUserModel.deleteOne({ _id: userSession._id }),
      ]);
      return handleError(400, "USER SEEION IS EXPIRED", null, next);
    } else {
      console.log("Session active.");
      await userModel.updateOne(
        { _id: userSession.user },
        {
          $set: { isActive: true },
        }
      ),
        next();
    }
  } catch (error) {
    console.error("Error in autoLogOut middleware:", error);
    return next(error);
  }
});

module.exports = autoLogOut;
