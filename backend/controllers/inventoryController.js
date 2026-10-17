const Product = require('../models/Product');

// Escape special characters before using search text in a regex.
const escapeRegex = (value) =>
   value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getInventory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 50)
    );

    const query = {};

    // Search by product name or SKU.
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const search = escapeRegex(req.query.search.trim());

      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category.
    if (
      typeof req.query.category === 'string' &&
      req.query.category.trim()
    ) {
      query.category = req.query.category.trim();
    }

    // Filter by stock range.
    const stockFilter = {};

    if (req.query.minStock !== undefined) {
      const minStock = Number(req.query.minStock);

      if (!Number.isFinite(minStock) || minStock < 0) {
        return res.status(400).json({
          message: 'minStock must be a non-negative number.',
        });
      }

      stockFilter.$gte = minStock;
    }

    if (req.query.maxStock !== undefined) {
      const maxStock = Number(req.query.maxStock);

      if (!Number.isFinite(maxStock) || maxStock < 0) {
        return res.status(400).json({
          message: 'maxStock must be a non-negative number.',
        });
      }

      stockFilter.$lte = maxStock;
    }

    if (
      stockFilter.$gte !== undefined &&
      stockFilter.$lte !== undefined &&
      stockFilter.$gte > stockFilter.$lte
    ) {
      return res.status(400).json({
        message: 'minStock cannot exceed maxStock.',
      });
    }

    if (Object.keys(stockFilter).length > 0) {
      query.stockQuantity = stockFilter;
    }

    // Filter by selling price range.
    const priceFilter = {};

    if (req.query.minPrice !== undefined) {
      const minPrice = Number(req.query.minPrice);

      if (!Number.isFinite(minPrice) || minPrice < 0) {
        return res.status(400).json({
          message: 'minPrice must be a non-negative number.',
        });
      }

      priceFilter.$gte = minPrice;
    }

    if (req.query.maxPrice !== undefined) {
      const maxPrice = Number(req.query.maxPrice);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          message: 'maxPrice must be a non-negative number.',
        });
      }

      priceFilter.$lte = maxPrice;
    }

    if (
      priceFilter.$gte !== undefined &&
      priceFilter.$lte !== undefined &&
      priceFilter.$gte > priceFilter.$lte
    ) {
      return res.status(400).json({
        message: 'minPrice cannot exceed maxPrice.',
      });
    }

    if (Object.keys(priceFilter).length > 0) {
      query.price = priceFilter;
    }

    // Allow only supported sort fields.
    const allowedSortFields = new Set([
      'productName',
      'sku',
      'category',
      'price',
      'cost',
      'stockQuantity',
      'reorderLevel',
      'lastUpdated',
    ]);

    let sort = { lastUpdated: -1 };

    if (typeof req.query.sort === 'string' && req.query.sort.trim()) {
      const sortValue = req.query.sort.trim();
      const descending = sortValue.startsWith('-');
      const field = descending ? sortValue.slice(1) : sortValue;

      if (!allowedSortFields.has(field)) {
        return res.status(400).json({
          message: 'Unsupported sort field.',
        });
      }

      sort = { [field]: descending ? -1 : 1 };
    }

    const skip = (page - 1) * limit;

    const [products, totalRecords] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return res.json({
      totalRecords,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      data: products,
    });
  } catch (error) {
    console.error('Error in getInventory:', error);

    return res.status(500).json({
      message: 'Failed to fetch inventory data.',
    });
  }
};

// Add a product after validation middleware.
const addProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    return res.status(201).json({
      message: 'Product created successfully.',
      product: newProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'SKU already exists.',
      });
    }

    console.error('Error adding product:', error);

    return res.status(500).json({
      message: 'Server error saving product.',
    });
  }
};

module.exports = { getInventory, addProduct };
