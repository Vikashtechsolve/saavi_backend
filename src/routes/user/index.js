const express = require("express");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const verifyToken = require("../../middleware/auth");

const router = express.Router();

// Helper function for user registration
const registerUser = async (userData) => {
  let user = await User.findOne({ email: userData.email });
  if (user) {
    throw new Error("User already exists");
  }

  user = new User(userData);
  await user.save();

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  return { user, token };
};

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.post(
  "/register",
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      const { user, token } = await registerUser({ ...req.body, role: "user" });

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400000,
      });
      return res.status(200).send({ message: "User registered OK" });
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        return res.status(400).json({ message: error.message });
      }
      console.log(error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);

router.post(
  "/admin/register",
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      const { user, token } = await registerUser({
        ...req.body,
        role: "admin",
      });

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400000,
      });
      return res.status(200).send({ message: "Admin registered successfully" });
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        return res.status(400).json({ message: error.message });
      }
      console.log(error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);

module.exports = router;
