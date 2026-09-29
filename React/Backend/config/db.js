const mongoose = require("mongoose");
const syncDatabase = require("./syncDatabase");

const connectDB = async () => {
  const connStr =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/college";

  try {
    console.log(`Connecting to MongoDB Compass database at: ${connStr}...`);
    await mongoose.connect(connStr);
    console.log(`[SUCCESS] Connected to MongoDB database: '${mongoose.connection.name}' on ${mongoose.connection.host}:${mongoose.connection.port}`);

    // Sync all food items and migrate users/orders into MongoDB
    await syncDatabase();
  } catch (error) {
    console.error(`[ERROR] MongoDB connection failed:`, error.message);
    console.error(`Please ensure MongoDB service or mongod is running on port 27017.`);
  }
};

module.exports = connectDB;