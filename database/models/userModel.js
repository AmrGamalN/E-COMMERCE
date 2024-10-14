const mongoose = require("mongoose");
require("dotenv").config();
const enums = require("../../handleCheck/role");

const schema = new mongoose.Schema(
  {
    fname: {
      type: String,
      required: true,
      // minLength: 3,
      // maxLength: 10,
    },
    lname: { type: String, required: true },
    fullName: { type: String },
    age: {
      type: String,
      required: true,
    },
    password: { type: String, required: true },
    confirmpassword: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      // validate: [validator.isEmail, "not email"],
    },
    phone: { type: String, required: true, unique: true },
    gender: { type: String, required: true },
    profilePhoto: {
      nameImage: {
        type: String,
      },
      path: {
        type: String,
      },
      size: {
        type: Number,
      },
      updated_at: {
        type: Date,
        default: Date.now,
      },
    },
    role: {
      type: String,
      enum: enums,
      default: enums.USER,
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Date,
      default: Date.now(),
      living: Boolean,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    OTP: {
      type: Number,
    },
  },
  { timestamps: true }
);

schema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const userModel = mongoose.model("User", schema);
userModel.find({}).sort({ fname: 1 });

module.exports = userModel;
