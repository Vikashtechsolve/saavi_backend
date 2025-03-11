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
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
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

const PORT = process.env.PORT || 8000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`Server running on ${BACKEND_URL}`);
});

// ✅ Self-pinging to prevent the server from sleeping
const PING_INTERVAL = 14.5 * 60 * 1000; // 14 minutes 30 seconds

const selfPing = async () => {
  try {
    console.log("Pinging server to keep it awake...");
    const response = await fetch(BACKEND_URL);
    if (!response.ok) {
      throw new Error(`Ping failed with status: ${response.status}`);
    }
    console.log("Ping successful!");
  } catch (error) {
    console.error("Error self-pinging:", error.message);
  }
};

// Start self-pinging after 30 seconds and repeat every 14m 30s
setTimeout(() => {
  selfPing();
  setInterval(selfPing, PING_INTERVAL);
}, 30000); // Wait 30 seconds before first ping
