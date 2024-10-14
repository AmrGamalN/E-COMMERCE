const mongoose = require("mongoose");
require("dotenv").config();
const URLmongoose = process.env.USER_URL;
const mongooseConnection = () => {
  mongoose
    .connect(URLmongoose)
    .then(console.log("db is connected"))
    .catch((err) => {
      console.error(err);
    })
    .finally(console.log("connected is done"));
};

module.exports = mongooseConnection;
