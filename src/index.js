const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const cookieParser = require("cookie-parser");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const routes = require("./routes/index");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
console.log(process.env.FRONTEND_URL);

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

routes(app);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

app.listen(8000, () => {
  console.log("server running on localhost:8000");
});
