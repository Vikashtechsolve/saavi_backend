const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const bodyParser = require('body-parser');
const authRoutes = require("./routes/auth");
const cookieParser = require("cookie-parser");
const axios = require('axios');
const crypto = require('crypto');
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const qs = require('qs');
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://saavihotels.com',
  'https://www.saavihotels.com',
  'https://saavi-frontend-admin.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    console.log('Incoming request origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'] // ✅ Add this
}));

app.options('*', cors()); // handle preflight



app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const routes = require("./routes/index");
const EASEBUZZ_KEY = "6O88WZZED7"; 
// process.env.EASEBUZZ_KEY;
const EASEBUZZ_SALT = "HSRJCSQDLJ" 
// process.env.EASEBUZZ_SALT;
const EASEBUZZ_ENV = "test";
// process.env.EASEBUZZ_ENV; // 'test' or 'prod'

const EASEBUZZ_BASE_URL = EASEBUZZ_ENV === 'test' ? 'https://testpay.easebuzz.in' : 'https://pay.easebuzz.in';

// app.post('/initiate-payment', async (req, res) => {
//   const { amount, productinfo, firstname, email, phone } = req.body;

//   const txnid = 'txn_' + Date.now(); // Unique transaction ID
//   const surl = 'http://yourdomain.com/success'; // Success URL
//   const furl = 'http://yourdomain.com/failure'; // Failure URL

//   // Generate hash
//   const hashString = `${EASEBUZZ_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${EASEBUZZ_SALT}`;
//   const hash = crypto.createHash('sha512').update(hashString).digest('hex');

//   const paymentData = {
//     key: EASEBUZZ_KEY,
//     txnid,
//     amount,
//     productinfo,
//     firstname,
//     email,
//     phone,
//     surl,
//     furl,
//     hash,
//   };

//   try {
//     const response = await axios.post(`${EASEBUZZ_BASE_URL}/payment/initiateLink`, qs.stringify(paymentData));
//     res.json(response.data);
//   } catch (error) {
//     res.status(500).json({ error: 'Payment initiation failed', details: error.message });
//   }
// });

app.post('/initiate-payment', async (req, res) => {
  const { amount, productinfo, firstname, email, phone } = req.body;

  // Validate required parameters
  if (!amount || !productinfo || !firstname || !email || !phone) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const txnid = 'txn_' + Date.now(); // Unique transaction ID
  const surl = 'http://yourdomain.com/success'; // Success URL
  const furl = 'http://yourdomain.com/failure'; // Failure URL

  // Generate hash
  const hashString = `${EASEBUZZ_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${EASEBUZZ_SALT}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');

  const paymentData = {
    key: EASEBUZZ_KEY,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl,
    furl,
    hash,
  };

  try {
    const response = await axios.post(`${EASEBUZZ_BASE_URL}/payment/initiateLink`, qs.stringify(paymentData), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { data } = response;
    if (data.status === 1) {
      // Redirect the user to the payment page
      res.redirect(data.payment_url);
    } else {
      res.status(400).json({ error: 'Payment initiation failed', details: data.data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Payment initiation failed', details: error.message });
  }
});


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
console.log(process.env.FRONTEND_URL);


app.use(cookieParser());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

routes(app);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

const PORT = process.env.PORT || 8000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;


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

app.listen(PORT, () => {
  console.log(`Server running on ${BACKEND_URL}`);
});