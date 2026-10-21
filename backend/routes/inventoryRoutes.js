
const express = require("express");
const router = express.Router();

const {
  getInventory,
  addProduct,
  updateProduct,
  exportInventoryCSV,
} = require("../controllers/inventoryController");

const {
  validateProduct,
  validateProductUpdate,
} = require("../middleware/validator");

// Download the currently filtered inventory as CSV.
router.get("/export", exportInventoryCSV);

// Get inventory with pagination, search, filters, and sorting.
router.get("/", getInventory);

// Create a product after strict validation.
router.post("/", validateProduct, addProduct);

// Update a product after validating the supplied fields
// and checking the price-versus-cost business rule.
router.put("/:id", validateProductUpdate, updateProduct);

module.exports = router;
