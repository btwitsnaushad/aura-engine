const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('DB connection failed:', err));

// routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);

// health check
app.get('/', (req, res) => {
  res.json({ status: "Aura Engine API is active" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});