const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
require("dotenv").config();

const fs = require("fs");
const os = require("os");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");

const Food = require("./models/Food");
const User = require("./models/User");
const Order = require("./models/Order");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Health Endpoint
app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "Online College Canteen API is running",
    database: mongoose.connection.name || "not connected",
    dbReadyState: mongoose.connection.readyState === 1 ? "Connected to MongoDB" : "Disconnected",
    time: new Date().toISOString()
  });
});

// Database Diagnostic Endpoint for MongoDB Compass Verification
app.get("/api/debug-db", async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    let counts = { users: 0, foods: 0, orders: 0 };
    let collections = [];

    if (isConnected) {
      const [uCount, fCount, oCount, colls] = await Promise.all([
        User.countDocuments(),
        Food.countDocuments(),
        Order.countDocuments(),
        mongoose.connection.db.listCollections().toArray()
      ]);
      counts = { users: uCount, foods: fCount, orders: oCount };
      collections = colls.map((c) => c.name);
    }

    res.json({
      connectedToMongoDB: isConnected,
      compassConnectionUrl: "mongodb://localhost:27017",
      databaseName: mongoose.connection.name || "college",
      documentCountsInCompass: counts,
      collectionsInCompass: collections,
      instructions: "In MongoDB Compass: 1. Click 'Connect' with mongodb://localhost:27017. 2. Look under the left sidebar for database '" + (mongoose.connection.name || "college") + "'."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);

// Serve Frontend Static Files (Vite build output in ../dist)
const distPath = path.join(__dirname, "../dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Client-side routing fallback for single SPA URL
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Online Canteen API is running. Run 'npm run build' inside React directory to serve frontend.");
  });
}

// Helper to get local network IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if ((iface.family === "IPv4" || iface.family === 4) && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Safe port binding with retry
const INITIAL_PORT = parseInt(process.env.PORT, 10) || 5001;
const HOST = "0.0.0.0";

async function startServer() {
  // Connect to MongoDB & sync seed data first
  await connectDB();

  function startListening(port, maxRetries = 10) {
    const server = app.listen(port, HOST, async () => {
      const localIp = getLocalIp();
      const dbName = mongoose.connection.name || "college";

      console.log(`\n======================================================`);
      console.log(` 🍲 Campus Canteen Portal is Live!`);
      console.log(` • Local URL:        http://localhost:${port}`);
      console.log(` • Same Wi-Fi URL:   http://${localIp}:${port}`);
      console.log(` • MongoDB Database: '${dbName}' on localhost:27017`);
      console.log(` • Verify Compass:   http://localhost:${port}/api/debug-db`);
      console.log(`======================================================\n`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && maxRetries > 0) {
        console.warn(`[Port ${port} Busy] Trying next port ${port + 1}...`);
        startListening(port + 1, maxRetries - 1);
      } else {
        console.error("[Server Error]", err.message);
      }
    });
  }

  startListening(INITIAL_PORT);
}

startServer();