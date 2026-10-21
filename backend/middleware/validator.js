
const { z } = require("zod");

const productFields = {
  productName: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.string().trim().min(1, "Category is required"),
  price: z.number().positive("Price must be greater than zero"),
  cost: z.number().positive("Cost must be greater than zero"),
  stockQuantity: z.number().min(0, "Stock cannot be negative"),
  reorderLevel: z.number().min(0, "Reorder level cannot be negative"),
};

const productValidationSchema = z
  .object(productFields)
  .strict()
  .refine((data) => data.price >= data.cost, {
    message: "Business Rule Violation: Price cannot be lower than cost",
    path: ["price"],
  });

const validateProduct = (req, res, next) => {
  const result = productValidationSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation Failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }

  req.body = result.data;
  next();
};

// Validate partial updates without calling omit() on a refined schema.
const validateProductUpdate = async (req, res, next) => {
  try {
    const partialSchema = z.object(productFields).partial().strict();
    const result = partialSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation Failed",
        details: result.error.issues.map((issue) => issue.message),
      });
    }

    if (Object.keys(result.data).length === 0) {
      return res.status(400).json({
        error: "Validation Failed",
        details: ["At least one valid field must be provided."],
      });
    }

    const Product = require("../models/Product");
    const existingProduct = await Product.findById(req.params.id).lean();

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const nextPrice = result.data.price ?? existingProduct.price;
    const nextCost = result.data.cost ?? existingProduct.cost;

    if (nextPrice < nextCost) {
      return res.status(400).json({
        error: "Validation Failed",
        details: [
          "Business Rule Violation: Price cannot be lower than cost",
        ],
      });
    }

    req.body = result.data;
    next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    console.error("Product update validation error:", error);

    return res.status(500).json({
      message: "Failed to validate product update.",
    });
  }
};

module.exports = {
  validateProduct,
  validateProductUpdate,
};
