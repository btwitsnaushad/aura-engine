const Product = require("../models/Product");

// Escape special characters so search text is treated literally.
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Only these fields can be used for sorting.
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

// Fields that can be updated through the API.
const allowedUpdateFields = new Set([
  "productName",
  "sku",
  "category",
  "price",
  "cost",
  "stockQuantity",
  "reorderLevel",
]);

// Build validated filters for inventory and CSV export.
const buildInventoryQuery = (queryParams) => {
  const query = {};

  // Search products by name or SKU.
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

  // Filter by category.
  if (
    typeof queryParams.category === "string" &&
    queryParams.category.trim()
  ) {
    query.category = queryParams.category.trim();
  }

  // Validate minimum and maximum stock.
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
        throw new Error(
          `${param} must be a non-negative number.`
        );
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

  // Validate minimum and maximum price.
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
        throw new Error(
          `${param} must be a non-negative number.`
        );
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

// Build a safe MongoDB sort object.
const buildSort = (sortValue, orderValue) => {
  const value =
    typeof sortValue === "string" && sortValue.trim()
      ? sortValue.trim()
      : "lastUpdated";

  const descending = value.startsWith("-");
  const field = descending ? value.slice(1) : value;

  if (!allowedSortFields.has(field)) {
    throw new Error("Unsupported sort field.");
  }

  let direction = descending ? -1 : 1;

  if (orderValue !== undefined && orderValue !== "") {
    if (
      typeof orderValue !== "string" ||
      !["asc", "desc"].includes(orderValue.toLowerCase())
    ) {
      throw new Error("Order must be either asc or desc.");
    }

    direction = orderValue.toLowerCase() === "desc" ? -1 : 1;
  }

  return { [field]: direction };
};

// Handle invalid query parameters consistently.
const handleQueryError = (error, res, operation) => {
  const message = error.message || "";

  const isClientError =
    message.includes("must be a non-negative number") ||
    message.includes("cannot exceed") ||
    message === "Unsupported sort field." ||
    message === "Order must be either asc or desc.";

  if (isClientError) {
    return res.status(400).json({
      success: false,
      message,
    });
  }

  console.error(`${operation}:`, error);

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
};

// GET /api/inventory
const getInventory = async (req, res) => {
  try {
    const pageInput = req.query.page;
    const limitInput = req.query.limit;

    const page = pageInput === undefined ? 1 : Number(pageInput);
    const limit = limitInput === undefined ? 50 : Number(limitInput);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page must be a positive integer and limit must be between 1 and 100.",
      });
    }

    const query = buildInventoryQuery(req.query);
    const sort = buildSort(req.query.sort, req.query.order);

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

    return res.status(200).json({
      totalRecords,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      data: products,
    });
  } catch (error) {
    return handleQueryError(
      error,
      res,
      "Error fetching inventory"
    );
  }
};

// GET /api/inventory/export
const exportInventoryCSV = async (req, res) => {
  let cursor;

  try {
    const query = buildInventoryQuery(req.query);
    const sort = buildSort(req.query.sort, req.query.order);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Aura_Engine_Inventory.csv"'
    );
    res.setHeader("Cache-Control", "no-store");

    // UTF-8 BOM improves compatibility with spreadsheet software.
    res.write("\uFEFF");

    const escapeCSVValue = (value) => {
      let text = String(value ?? "");

      // Reduce spreadsheet formula-injection risk.
      if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

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
      if (res.destroyed) {
        return;
      }

      const row = [
        product.sku,
        product.productName,
        product.category,
        product.price,
        product.cost,
        product.stockQuantity,
        product.reorderLevel,
        product.lastUpdated
          ? new Date(product.lastUpdated).toISOString()
          : "",
      ]
        .map(escapeCSVValue)
        .join(",");

      if (!res.write(row + "\r\n")) {
        await new Promise((resolve, reject) => {
          const cleanup = () => {
            res.off("drain", onDrain);
            res.off("error", onError);
            res.off("close", onClose);
          };

          const onDrain = () => {
            cleanup();
            resolve();
          };

          const onError = (error) => {
            cleanup();
            reject(error);
          };

          const onClose = () => {
            cleanup();
            reject(new Error("CSV response was closed."));
          };

          res.once("drain", onDrain);
          res.once("error", onError);
          res.once("close", onClose);
        });
      }
    }

    return res.end();
  } catch (error) {
    if (cursor) {
      await cursor.close().catch(() => {});
    }

    if (res.destroyed) {
      return;
    }

    console.error("Error exporting inventory:", error);

    if (!res.headersSent) {
      return handleQueryError(
        error,
        res,
        "Error exporting inventory"
      );
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

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Product validation failed.",
        details: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    console.error("Error adding product:", error);

    return res.status(500).json({
      message: "Server error saving product.",
    });
  }
};

// PUT /api/inventory/:id
const updateProduct = async (req, res) => {
  try {
    const updates = {};

    for (const field of allowedUpdateFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid product fields provided for update.",
      });
    }

    updates.lastUpdated = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: "SKU already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Product validation failed.",
        details: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    console.error("Error updating product:", error);

    return res.status(500).json({
      message: "Server error updating product.",
    });
  }
};

// DELETE /api/inventory/:id
const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully.",
      product: deletedProduct,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    console.error("Error deleting product:", error);

    return res.status(500).json({
      message: "Server error deleting product.",
    });
  }
};

module.exports = {
  getInventory,
  addProduct,
  updateProduct,
  deleteProduct,
  exportInventoryCSV,
};
