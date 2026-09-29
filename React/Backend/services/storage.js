const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Food = require("../models/Food");
const User = require("../models/User");
const Order = require("../models/Order");
const { sampleFoods } = require("../data/seedData");

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "canteen_data.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate unique ID for JSON store
function generateId() {
  return "id_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Default initial state
function getDefaultState() {
  const adminHashed = bcrypt.hashSync("admin123", 10);
  const studentHashed = bcrypt.hashSync("student123", 10);

  const adminUser = {
    _id: "user_admin_001",
    name: "Canteen Admin",
    email: "admin@canteen.edu",
    password: adminHashed,
    role: "ADMIN",
    createdAt: new Date().toISOString()
  };

  const studentUser = {
    _id: "user_student_001",
    name: "Alex Johnson",
    email: "student@canteen.edu",
    password: studentHashed,
    role: "STUDENT",
    createdAt: new Date().toISOString()
  };

  const foods = sampleFoods.map((f, idx) => ({
    _id: `food_${String(idx + 1).padStart(3, "0")}`,
    ...f,
    createdAt: new Date().toISOString()
  }));

  return {
    users: [adminUser, studentUser],
    foods,
    orders: []
  };
}

// Load JSON data
function loadJsonData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.foods && parsed.foods.length >= 25) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read local JSON data, resetting:", err.message);
  }

  const initial = getDefaultState();
  saveJsonData(initial);
  return initial;
}

// Save JSON data
function saveJsonData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to JSON data store:", err.message);
  }
}

// Check if MongoDB is connected & ready
function isMongoReady() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// Auto-seed MongoDB if empty
async function syncMongoSeed() {
  if (!isMongoReady()) return;
  try {
    const foodCount = await Food.countDocuments();
    if (foodCount < 20) {
      console.log(`[MongoDB] Seeding ${sampleFoods.length} fresh food items into MongoDB...`);
      for (const item of sampleFoods) {
        const found = await Food.findOne({ name: item.name });
        if (!found) {
          await Food.create(item);
        }
      }
      console.log("[MongoDB] Food items seeded successfully!");
    }

    // Ensure Admin
    const adminFound = await User.findOne({ email: "admin@canteen.edu" });
    if (!adminFound) {
      const hashed = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Canteen Admin",
        email: "admin@canteen.edu",
        password: hashed,
        role: "ADMIN"
      });
      console.log("[MongoDB] Created default admin account: admin@canteen.edu");
    }

    // Ensure Demo Student
    const studentFound = await User.findOne({ email: "student@canteen.edu" });
    if (!studentFound) {
      const hashed = await bcrypt.hash("student123", 10);
      await User.create({
        name: "Alex Johnson",
        email: "student@canteen.edu",
        password: hashed,
        role: "STUDENT"
      });
    }
  } catch (e) {
    console.warn("[MongoDB Seed Notice]:", e.message);
  }
}

// Initialize seed on module load
loadJsonData();

const storage = {
  isMongoReady,
  syncMongoSeed,

  // --- FOOD METHODS ---
  async getFoods({ search = "", category = "", isVeg = null }) {
    if (isMongoReady()) {
      try {
        const query = {};
        if (search) {
          query.name = { $regex: search, $options: "i" };
        }
        if (category && category !== "All") {
          query.category = { $regex: `^${category}$`, $options: "i" };
        }
        if (isVeg !== null && isVeg !== undefined && isVeg !== "") {
          query.isVeg = isVeg === true || isVeg === "true";
        }
        return await Food.find(query).sort({ createdAt: -1 });
      } catch (err) {
        console.warn("Mongo query failed, falling back to JSON:", err.message);
      }
    }

    const data = loadJsonData();
    let result = data.foods;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(s) ||
          (f.description && f.description.toLowerCase().includes(s)) ||
          f.category.toLowerCase().includes(s)
      );
    }

    if (category && category !== "All") {
      result = result.filter((f) => f.category.toLowerCase() === category.toLowerCase());
    }

    if (isVeg !== null && isVeg !== undefined && isVeg !== "") {
      const vegBool = isVeg === true || isVeg === "true";
      result = result.filter((f) => f.isVeg === vegBool);
    }

    return result;
  },

  async getFoodById(id) {
    if (isMongoReady()) {
      try {
        return await Food.findById(id);
      } catch (_) {}
    }
    const data = loadJsonData();
    return data.foods.find((f) => String(f._id) === String(id)) || null;
  },

  async createFood(foodData) {
    if (isMongoReady()) {
      try {
        return await Food.create(foodData);
      } catch (err) {
        console.warn("Mongo create failed, falling back to JSON:", err.message);
      }
    }

    const data = loadJsonData();
    const newFood = {
      _id: generateId(),
      name: foodData.name,
      category: foodData.category,
      price: Number(foodData.price),
      description: foodData.description || "",
      image: foodData.image || "",
      available: foodData.available !== undefined ? foodData.available : true,
      isVeg: foodData.isVeg !== undefined ? foodData.isVeg : true,
      rating: foodData.rating || 4.5,
      prepTime: foodData.prepTime || "10 mins",
      badge: foodData.badge || "",
      spicyLevel: foodData.spicyLevel || 0,
      createdAt: new Date().toISOString()
    };
    data.foods.unshift(newFood);
    saveJsonData(data);
    return newFood;
  },

  async updateFood(id, foodData) {
    if (isMongoReady()) {
      try {
        return await Food.findByIdAndUpdate(id, foodData, { new: true, runValidators: true });
      } catch (err) {
        console.warn("Mongo update failed, falling back to JSON:", err.message);
      }
    }

    const data = loadJsonData();
    const idx = data.foods.findIndex((f) => String(f._id) === String(id));
    if (idx === -1) return null;

    data.foods[idx] = {
      ...data.foods[idx],
      ...foodData,
      price: foodData.price !== undefined ? Number(foodData.price) : data.foods[idx].price
    };
    saveJsonData(data);
    return data.foods[idx];
  },

  async deleteFood(id) {
    if (isMongoReady()) {
      try {
        return await Food.findByIdAndDelete(id);
      } catch (_) {}
    }

    const data = loadJsonData();
    const idx = data.foods.findIndex((f) => String(f._id) === String(id));
    if (idx === -1) return null;
    const removed = data.foods.splice(idx, 1)[0];
    saveJsonData(data);
    return removed;
  },

  // --- USER METHODS ---
  async findUserByEmail(email) {
    if (isMongoReady()) {
      try {
        return await User.findOne({ email: email.toLowerCase() });
      } catch (_) {}
    }
    const data = loadJsonData();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (isMongoReady()) {
      try {
        return await User.findById(id).select("-password");
      } catch (_) {}
    }
    const data = loadJsonData();
    const user = data.users.find((u) => String(u._id) === String(id));
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async createUser(userData) {
    if (isMongoReady()) {
      try {
        return await User.create(userData);
      } catch (err) {
        console.warn("Mongo user creation failed, falling back to JSON:", err.message);
      }
    }

    const data = loadJsonData();
    const newUser = {
      _id: generateId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role || "STUDENT",
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    saveJsonData(data);
    return newUser;
  },

  // --- ORDER METHODS ---
  async createOrder({ userId, items, totalAmount }) {
    if (isMongoReady()) {
      try {
        return await Order.create({
          user: userId,
          items,
          totalAmount
        });
      } catch (err) {
        console.warn("Mongo order creation failed, falling back to JSON:", err.message);
      }
    }

    const data = loadJsonData();
    const user = data.users.find((u) => String(u._id) === String(userId));
    const tokenNumber = Math.floor(100 + Math.random() * 900);
    const newOrder = {
      _id: "ord_" + Date.now().toString(36).toUpperCase(),
      tokenNumber,
      user: {
        _id: userId,
        name: user ? user.name : "Student",
        email: user ? user.email : ""
      },
      items,
      totalAmount,
      status: "PLACED",
      createdAt: new Date().toISOString()
    };
    data.orders.unshift(newOrder);
    saveJsonData(data);
    return newOrder;
  },

  async getUserOrders(userId) {
    if (isMongoReady()) {
      try {
        return await Order.find({ user: userId })
          .populate("user", "name email")
          .sort({ createdAt: -1 });
      } catch (_) {}
    }
    const data = loadJsonData();
    return data.orders.filter(
      (o) => String(o.user?._id || o.user) === String(userId)
    );
  },

  async getAllOrders() {
    if (isMongoReady()) {
      try {
        return await Order.find()
          .populate("user", "name email")
          .sort({ createdAt: -1 });
      } catch (_) {}
    }
    const data = loadJsonData();
    return data.orders;
  },

  async getOrderById(id) {
    if (isMongoReady()) {
      try {
        return await Order.findById(id).populate("user", "name email");
      } catch (_) {}
    }
    const data = loadJsonData();
    return data.orders.find((o) => String(o._id) === String(id)) || null;
  },

  async updateOrderStatus(id, status) {
    if (isMongoReady()) {
      try {
        return await Order.findByIdAndUpdate(id, { status }, { new: true });
      } catch (_) {}
    }
    const data = loadJsonData();
    const order = data.orders.find((o) => String(o._id) === String(id));
    if (!order) return null;
    order.status = status;
    saveJsonData(data);
    return order;
  }
};

module.exports = storage;
