const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretcollegekey123";

const createToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "7d"
  });
};

/*
  STUDENT SIGNUP - Directly saved to MongoDB
*/
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        message: "Password must be at least 4 characters long"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing user in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered. Please log in."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save directly to MongoDB 'users' collection
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "STUDENT"
    });

    console.log(`[MongoDB] New user registered and saved to MongoDB: ${user.name} (${user.email}) - ID: ${user._id}`);

    res.status(201).json({
      message: "Signup successful",
      token: createToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Signup error in MongoDB:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email is already registered. Please log in."
      });
    }
    res.status(500).json({
      message: error.message
    });
  }
});

/*
  LOGIN - Directly authenticated against MongoDB
*/
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user in MongoDB
    let user = await User.findOne({ email: cleanEmail });

    // Fallback: If demo user not yet in MongoDB, create it
    if (!user && cleanEmail === "student@canteen.edu" && password === "student123") {
      const hashedPassword = await bcrypt.hash("student123", 10);
      user = await User.create({
        name: "Alex Johnson",
        email: "student@canteen.edu",
        password: hashedPassword,
        role: "STUDENT"
      });
    } else if (!user && cleanEmail === "admin@canteen.edu" && password === "admin123") {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      user = await User.create({
        name: "Canteen Admin",
        email: "admin@canteen.edu",
        password: hashedPassword,
        role: "ADMIN"
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    console.log(`[MongoDB] User logged in: ${user.name} (${user.email}) - Role: ${user.role}`);

    res.json({
      message: "Login successful",
      token: createToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error in MongoDB:", error.message);
    res.status(500).json({
      message: error.message
    });
  }
});

/*
  GET CURRENT USER PROFILE FROM MONGODB
*/
router.get("/me", protect, async (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = router;