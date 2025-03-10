const express = require("express");
const { check, validationResult } = require("express-validator");
const User = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../middleware/auth");

const router = express.Router();

// Validation middleware
const loginValidationRules = [
  check("email", "Email is required").isEmail(),
  check("password", "Password with 6 or more characters required").isLength({
    min: 6,
  }),
];

// Shared authentication function
const authenticateUser = async (email, password, requireAdmin = false) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid Credentials");
  }

  if (requireAdmin && user.role !== "admin") {
    throw new Error("Access denied. Admin only.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  const tokenPayload = {
    userId: user._id,
    ...(requireAdmin && { isAdmin: true }),
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  return { token, userId: user._id };
};

// Shared response handler
const handleAuthResponse = (res, token, userId) => {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400000,
  });
  res.status(200).json({ userId });
};

router.post("/login", loginValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const { token, userId } = await authenticateUser(email, password);
    handleAuthResponse(res, token, userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    const status = message === "Invalid Credentials" ? 400 : 500;
    res.status(status).json({ message });
  }
});

router.post("/admin/login", loginValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const { token, userId } = await authenticateUser(email, password, true);
    handleAuthResponse(res, token, userId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    const status =
      message === "Access denied. Admin only."
        ? 403
        : message === "Invalid Credentials"
        ? 400
        : 500;
    res.status(status).json({ message });
  }
});

router.get("/validate-token", verifyToken, (req, res) => {
  res.status(200).send({ userId: req.userId });
});

router.post("/logout", (req, res) => {
  res.cookie("auth_token", "", {
    expires: new Date(0),
  });
  res.send();
});

module.exports = router;
