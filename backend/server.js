
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'Aura Engine API is active'
  });
});

// Connect to MongoDB, then start the server
const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

startServer();