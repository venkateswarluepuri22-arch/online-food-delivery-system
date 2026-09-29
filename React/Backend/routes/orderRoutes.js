const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Food = require("../models/Food");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

/*
  STUDENT PLACE ORDER - Directly saved into MongoDB 'orders' collection
*/
router.post("/", protect, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const foodId = item.food || item._id;
      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          message: "Invalid quantity for item"
        });
      }

      // Find food in MongoDB
      let food = null;
      if (mongoose.Types.ObjectId.isValid(foodId)) {
        food = await Food.findById(foodId);
      }
      if (!food && item.name) {
        food = await Food.findOne({ name: item.name });
      }

      if (!food) {
        return res.status(400).json({
          message: `Food item (${item.name || foodId}) not found in MongoDB`
        });
      }

      if (!food.available) {
        return res.status(400).json({
          message: `Item "${food.name}" is currently sold out`
        });
      }

      orderItems.push({
        food: food._id,
        name: food.name,
        price: food.price,
        image: food.image || "",
        quantity
      });

      calculatedTotal += food.price * quantity;
    }

    const tokenNumber = Math.floor(100 + Math.random() * 900);

    // Save directly to MongoDB 'orders' collection
    const order = await Order.create({
      user: req.user._id,
      tokenNumber,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: "PLACED"
    });

    console.log(`[MongoDB] New order saved directly to MongoDB Compass database: Order #${order._id} (Token: #${tokenNumber}) - Total: ₹${calculatedTotal}`);

    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation error in MongoDB:", error.message);
    res.status(400).json({
      message: error.message
    });
  }
});

/*
  STUDENT ORDER HISTORY - Read directly from MongoDB
*/
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

/*
  GET SINGLE ORDER FROM MONGODB
*/
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const orderUserId = order.user?._id || order.user;
    if (req.user.role !== "ADMIN" && String(orderUserId) !== String(req.user._id)) {
      return res.status(403).json({
        message: "You are not allowed to view this order"
      });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

/*
  ADMIN VIEW ALL ORDERS - Read directly from MongoDB
*/
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

/*
  ADMIN CHANGE ORDER STATUS - Update directly in MongoDB
*/
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const allowedStatuses = [
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "COMPLETED",
      "CANCELLED"
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    console.log(`[MongoDB] Updated order #${order._id} status to: ${status}`);

    res.json(order);
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

module.exports = router;