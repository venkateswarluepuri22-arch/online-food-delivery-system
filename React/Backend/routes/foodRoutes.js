const express = require("express");
const Food = require("../models/Food");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

/*
  GET FOOD MENU - Directly from MongoDB 'foods' collection
*/
router.get("/", async (req, res) => {
  try {
    const { search = "", category = "", isVeg } = req.query;

    const query = {};

    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    if (category && category !== "All") {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    if (isVeg !== null && isVeg !== undefined && isVeg !== "") {
      query.isVeg = isVeg === true || isVeg === "true";
    }

    const foods = await Food.find(query).sort({ createdAt: -1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
  GET SINGLE FOOD ITEM
*/
router.get("/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: "Food item not found" });
    }
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
  ADMIN ADD FOOD - Directly into MongoDB
*/
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: "Name, category, and price are required" });
    }

    const food = await Food.create({
      ...req.body,
      price: Number(price)
    });

    console.log(`[MongoDB] New food item added to MongoDB: ${food.name} (₹${food.price})`);

    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/*
  ADMIN UPDATE FOOD - Directly into MongoDB
*/
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        price: req.body.price !== undefined ? Number(req.body.price) : undefined
      },
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({ message: "Food item not found" });
    }

    console.log(`[MongoDB] Updated food item: ${food.name}`);

    res.json(food);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/*
  ADMIN DELETE FOOD - Directly from MongoDB
*/
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).json({ message: "Food item not found" });
    }

    console.log(`[MongoDB] Deleted food item from MongoDB: ${food.name}`);

    res.json({ message: "Food item deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;