const express = require("express");
const process = require("process");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const { userRouters, adminRouters } = require("./routes/userRoute");
const productRouters = require("./routes/productRoute");
const categoryRouters = require("./routes/categoryRoute");
const pageRouters = require("./routes/PageRoute");
const orderRouters = require("./routes/orderRoute");
const reviewRouters = require("./routes/reviewRoute");
const cartRouters = require("./routes/cartRoute");
const paymobRouters = require("./routes/paymodRoute");

const mongooseConnection = require("./database/mongoose_connection");
mongooseConnection();

const port = process.env.PORT;
const tempelatePath = path.join(__dirname, "template");

const app = express();
app.use(express.json());
app.use(cors());

app.set("view engine", "html");
app.engine("html", require("hbs").__express);
app.set("views", tempelatePath);
app.use(express.urlencoded({ limit: "1mb", extended: false }));
app.use(express.static("uploads"));

app.use("/", productRouters);
app.use("/api/category", categoryRouters);
app.use("/api/page", pageRouters);
app.use("/api/user", userRouters);
app.use("/api/admin", adminRouters);
app.use("/api/order", orderRouters);
app.use("/api/review", reviewRouters);
app.use("/api/cart", cartRouters);
app.use("/api/pay", paymobRouters);

app.all("*", (req, res, next) => {
  res.status(404).json("NOT FOUND");
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 400).json({
    status: err.status,
    statusCode: err.statusCode,
    statusText: err.statusText,
    message: err.message || null,
    data: err.data,
  });
});


app.listen(port, () => {
  console.log(`server is working ${port}`);
});
  