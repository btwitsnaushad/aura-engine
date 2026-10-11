const Product = require('../models/Product');

const getInventory = async (req, res) => {
  try {
    // extract pagination params, default to page 1 and 50 items
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      // 'i' makes the regex case-insensitive
      query.productName = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    // fetch data and count total docs in parallel to save execution time
    const [products, totalRecords] = await Promise.all([
      Product.find(query)
        .sort(req.query.sort || '-lastUpdated')
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      totalRecords,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      data: products
    });

  } catch (error) {
    console.error("Error in getInventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory data" });
  }
};

module.exports = { getInventory };