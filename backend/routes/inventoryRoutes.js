const express = require("express");
const router = express.Router();

const {
  getInventory,
  addProduct,
  updateProduct,
  deleteProduct,
  exportInventoryCSV,
} = require("../controllers/inventoryController");

const {
  validateProduct,
  validateProductUpdate,
} = require("../middleware/validator");

// Export inventory as CSV
router.get("/export", exportInventoryCSV);

// Get inventory
router.get("/", getInventory);

// Create product
router.post("/", validateProduct, addProduct);

// Update product
router.put("/:id", validateProductUpdate, updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

module.exports = router;