const express = require('express');
const router = express.Router();
const { getInventory, addProduct } = require('../controllers/inventoryController');
const { validateProduct } = require('../middleware/validator');

// GET route for fetching inventory (with pagination, search, filter)
router.get('/', getInventory);

// POST route protected by strict Zod validation (Business rules applied)
router.post('/', validateProduct, addProduct);

module.exports = router;