const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Food = require("../models/Food");
const User = require("../models/User");
const Order = require("../models/Order");
const { sampleFoods } = require("../data/seedData");

const DATA_FILE = path.join(__dirname, "../data/canteen_data.json");

async function syncDatabase() {
  try {
    console.log("\n========================================================");
    console.log("🔄 SYNCING DATA DIRECTLY INTO MONGODB COMPASS DATABASE...");
    console.log("========================================================");

    // Clean up any stale legacy indexes (e.g. username_1) from users collection
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const userIndexes = await mongoose.connection.db.collection("users").indexes();
        for (const idx of userIndexes) {
          if (idx.name !== "_id_" && idx.name !== "email_1") {
            await mongoose.connection.db.collection("users").dropIndex(idx.name);
            console.log(`[CLEANUP] Dropped stale '${idx.name}' index from 'users' collection.`);
          }
        }
        await User.createIndexes();
      }
    } catch (idxErr) {
      console.warn("Index cleanup notice:", idxErr.message);
    }

    // 1. Sync all 32 Food items into MongoDB
    console.log(`[1/3] Syncing ${sampleFoods.length} food items to MongoDB 'foods' collection...`);
    for (const item of sampleFoods) {
      await Food.findOneAndUpdate(
        { name: item.name },
        { $set: item },
        { upsert: true, new: true }
      );
    }
    const foodCount = await Food.countDocuments();
    console.log(`[OK] MongoDB 'foods' collection now has ${foodCount} items.`);

    // 2. Ensure default Admin & Student accounts in MongoDB
    const adminEmail = "admin@canteen.edu";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashed = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        name: "Canteen Admin",
        email: adminEmail,
        password: hashed,
        role: "ADMIN"
      });
      console.log(`[OK] Created default Admin: ${adminEmail}`);
    }

    const studentEmail = "student@canteen.edu";
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const hashed = await bcrypt.hash("student123", 10);
      student = await User.create({
        name: "Alex Johnson",
        email: studentEmail,
        password: hashed,
        role: "STUDENT"
      });
      console.log(`[OK] Created default Student: ${studentEmail}`);
    }

    // 3. Migrate any users and orders created in JSON fallback into MongoDB!
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const jsonData = JSON.parse(raw);
        const userMap = {}; // jsonId -> mongoUserDoc

        if (Array.isArray(jsonData.users)) {
          for (const u of jsonData.users) {
            let mongoUser = await User.findOne({ email: u.email.toLowerCase() });
            if (!mongoUser) {
              mongoUser = await User.create({
                name: u.name,
                email: u.email.toLowerCase(),
                password: u.password, // already hashed
                role: u.role || "STUDENT"
              });
              console.log(`[OK] Migrated user to MongoDB 'users': ${u.name} (${u.email})`);
            }
            userMap[u._id] = mongoUser;
            userMap[u.email.toLowerCase()] = mongoUser;
          }
        }

        if (Array.isArray(jsonData.orders)) {
          for (const ord of jsonData.orders) {
            // Find target user in MongoDB
            const targetUser =
              userMap[ord.user?._id] ||
              userMap[ord.user?.email?.toLowerCase()] ||
              (ord.user?.email ? await User.findOne({ email: ord.user.email.toLowerCase() }) : null) ||
              student;

            if (!targetUser) continue;

            // Map order items to real MongoDB food documents
            const mongoItems = [];
            for (const itm of ord.items || []) {
              let foodDoc = null;
              if (itm.food && itm.food.length === 24) {
                try {
                  foodDoc = await Food.findById(itm.food);
                } catch (_) {}
              }
              if (!foodDoc) {
                foodDoc = await Food.findOne({ name: itm.name });
              }
              if (!foodDoc) {
                foodDoc = await Food.findOne();
              }

              if (foodDoc) {
                mongoItems.push({
                  food: foodDoc._id,
                  name: itm.name || foodDoc.name,
                  price: itm.price || foodDoc.price,
                  image: itm.image || foodDoc.image || "",
                  quantity: itm.quantity || 1
                });
              }
            }

            if (mongoItems.length > 0) {
              const existingOrder = await Order.findOne({
                user: targetUser._id,
                totalAmount: ord.totalAmount,
                createdAt: ord.createdAt
              });

              if (!existingOrder) {
                await Order.create({
                  user: targetUser._id,
                  tokenNumber: ord.tokenNumber || Math.floor(100 + Math.random() * 900),
                  items: mongoItems,
                  totalAmount: ord.totalAmount,
                  status: ord.status || "PLACED"
                });
                console.log(`[OK] Migrated order to MongoDB 'orders' for ${targetUser.email} (Total: ₹${ord.totalAmount})`);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Migration notice:", err.message);
      }
    }

    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    console.log("--------------------------------------------------------");
    console.log(`📊 MONGODB DATABASE STATUS:`);
    console.log(` • Database Name:  college`);
    console.log(` • 'foods' docs:   ${foodCount}`);
    console.log(` • 'users' docs:   ${totalUsers}`);
    console.log(` • 'orders' docs:  ${totalOrders}`);
    console.log(`🔍 In MongoDB Compass: Look under database 'college'`);
    console.log("========================================================\n");
  } catch (error) {
    console.error("syncDatabase error:", error.message);
  }
}

module.exports = syncDatabase;
