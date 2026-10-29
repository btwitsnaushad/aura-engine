const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Product = require("./models/Product");
const inventoryRoutes = require("./routes/inventoryRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "Aura Engine API is active",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Verify required MongoDB indexes
const verifyProductIndexes = async () => {
  const requiredIndexes = ["sku", "category", "productName"];

  const indexes = await Product.collection.indexes();

  console.log("\nProduct Index Verification:");

  indexes.forEach((index) => {
    console.log(`${index.name}:`, index.key);
  });

  for (const field of requiredIndexes) {
    const exists = indexes.some(
      (index) =>
        Object.prototype.hasOwnProperty.call(index.key, field) &&
        index.key[field] === 1
    );

    if (!exists) {
      console.warn(`WARNING: Index for "${field}" was not found.`);
    } else {
      console.log(`Verified index: ${field}`);
    }
  }
};

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing from the environment variables."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected successfully.");

    // Check indexes after connecting to MongoDB
    await verifyProductIndexes();

    // Start the API server
    app.listen(PORT, () => {
      console.log(`Aura Engine API is running on port ${PORT}.`);
      console.log(`Health check: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

// Handle unexpected database disconnection
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection disconnected.");
});

startServer();