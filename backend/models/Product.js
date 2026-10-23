
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  stockQuantity: {
    type: Number,
    required: true
  },
  reorderLevel: {
    type: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Indexes for frequently queried fields
productSchema.index({ category: 1 });
productSchema.index({ productName: 1 });

// Supports sorting low-stock products by quantity and name
productSchema.index({ stockQuantity: 1, productName: 1 });

module.exports = mongoose.model('Product', productSchema);
