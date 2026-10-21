
const Product = require("../models/Product");

// Escape special characters so search text is treated literally.
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const allowedSortFields = new Set([
  "productName",
  "sku",
  "category",
  "price",
  "cost",
  "stockQuantity",
  "reorderLevel",
  "lastUpdated",
]);

// Build the same validated filters for both inventory and CSV export.
const buildInventoryQuery = (queryParams) => {
  const query = {};

  if (
    typeof queryParams.search === "string" &&
    queryParams.search.trim()
  ) {
    const search = escapeRegex(queryParams.search.trim());

    query.$or = [
      { productName: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }

  if (
    typeof queryParams.category === "string" &&
    queryParams.category.trim()
  ) {
    query.category = queryParams.category.trim();
  }

  const stockFilter = {};

  for (const [param, operator] of [
    ["minStock", "$gte"],
    ["maxStock", "$lte"],
  ]) {
    if (
      queryParams[param] !== undefined &&
      queryParams[param] !== ""
    ) {
      const value = Number(queryParams[param]);

      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${param} must be a non-negative number.`);
      }

      stockFilter[operator] = value;
    }
  }

  if (
    stockFilter.$gte !== undefined &&
    stockFilter.$lte !== undefined &&
    stockFilter.$gte > stockFilter.$lte
  ) {
    throw new Error("minStock cannot exceed maxStock.");
  }

  if (Object.keys(stockFilter).length > 0) {
    query.stockQuantity = stockFilter;
  }

  const priceFilter = {};

  for (const [param, operator] of [
    ["minPrice", "$gte"],
    ["maxPrice", "$lte"],
  ]) {
    if (
      queryParams[param] !== undefined &&
      queryParams[param] !== ""
    ) {
      const value = Number(queryParams[param]);

      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${param} must be a non-negative number.`);
      }

      priceFilter[operator] = value;
    }
  }

  if (
    priceFilter.$gte !== undefined &&
    priceFilter.$lte !== undefined &&
    priceFilter.$gte > priceFilter.$lte
  ) {
    throw new Error("minPrice cannot exceed maxPrice.");
  }

  if (Object.keys(priceFilter).length > 0) {
    query.price = priceFilter;
  }

  return query;
};

const buildSort = (sortValue) => {
  const value =
    typeof sortValue === "string" && sortValue.trim()
      ? sortValue.trim()
      : "-lastUpdated";

  const descending = value.startsWith("-");
  const field = descending ? value.slice(1) : value;

  if (!allowedSortFields.has(field)) {
    throw new Error("Unsupported sort field.");
  }

  return { [field]: descending ? -1 : 1 };
};

// GET /api/inventory
const getInventory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 50)
    );

    const query = buildInventoryQuery(req.query);
    const sort = buildSort(req.query.sort);
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
    if (
      error.message.includes("must be a non-negative number") ||
      error.message.includes("cannot exceed") ||
      error.message === "Unsupported sort field."
    ) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Error in getInventory:", error);

    return res.status(500).json({
      message: "Failed to fetch inventory data.",
    });
  }
};

// GET /api/inventory/export
// Stream CSV rows instead of loading all products into browser memory.
const exportInventoryCSV = async (req, res) => {
  let cursor;

  try {
    const query = buildInventoryQuery(req.query);
    const sort = buildSort(req.query.sort);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Aura_Engine_Inventory.csv"'
    );
    res.setHeader("Cache-Control", "no-store");

    // UTF-8 BOM helps Excel display text correctly.
    res.write("\uFEFF");

    const escapeCSVValue = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "SKU",
      "Product Name",
      "Category",
      "Price",
      "Cost",
      "Stock Quantity",
      "Reorder Level",
      "Last Updated",
    ];

    res.write(headers.map(escapeCSVValue).join(",") + "\r\n");

    cursor = Product.find(query)
      .select(
        "sku productName category price cost stockQuantity reorderLevel lastUpdated -_id"
      )
      .sort(sort)
      .lean()
      .cursor({ batchSize: 1000 });

    for await (const product of cursor) {
      const row = [
        product.sku,
        product.productName,
        product.category,
        product.price,
        product.cost,
        product.stockQuantity,
        product.reorderLevel,
        product.lastUpdated,
      ]
        .map(escapeCSVValue)
        .join(",");

      if (!res.write(row + "\r\n")) {
        await new Promise((resolve, reject) => {
          res.once("drain", resolve);
          res.once("error", reject);
        });
      }
    }

    return res.end();
  } catch (error) {
    if (cursor) {
      await cursor.close().catch(() => {});
    }

    console.error("Error exporting inventory:", error);

    if (!res.headersSent) {
      if (
        error.message.includes("must be a non-negative number") ||
        error.message.includes("cannot exceed") ||
        error.message === "Unsupported sort field."
      ) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({
        message: "Failed to export inventory.",
      });
    }

    return res.destroy(error);
  }
};

// POST /api/inventory
const addProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    return res.status(201).json({
      message: "Product created successfully.",
      product: newProduct,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "SKU already exists.",
      });
    }

    console.error("Error adding product:", error);

    return res.status(500).json({
      message: "Server error saving product.",
    });
  }
};

module.exports = {
  getInventory,
  addProduct,
  exportInventoryCSV,
};