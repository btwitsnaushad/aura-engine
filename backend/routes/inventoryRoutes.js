
const express = require("express");
const router = express.Router();

const {
  getInventory,
  addProduct,
  exportInventoryCSV,
} = require("../controllers/inventoryController");

const { validateProduct } = require("../middleware/validator");

// Export CSV before the general inventory route.
router.get("/export", exportInventoryCSV);

// Get inventory with pagination, search, sorting, and filters.
router.get("/", getInventory);

// Create a product after Zod validation.
router.post("/", validateProduct, addProduct);

module.exports = router;
