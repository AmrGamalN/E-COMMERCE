const mongoose = require("mongoose");

const sechemToken = new mongoose.Schema(
  {
    user: {
      //take id from user database
      type: String,
      ref: "User",
      required: false,
    },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    token: { type: String, required: false },
    OTP: { type: Number, required: false },
  },
  { timestamps: true }
);

const tokenActiveUser = mongoose.model("Token", sechemToken);
module.exports = tokenActiveUser;
