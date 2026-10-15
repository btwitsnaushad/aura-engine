const { z } = require('zod');

// define strict validation rules exactly as requested by the client
const productValidationSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().positive("Price must be greater than zero"),
  cost: z.number().positive("Cost must be greater than zero"),
  stockQuantity: z.number().min(0, "Stock cannot be negative"), 
  reorderLevel: z.number().min(0)
}).refine((data) => data.price >= data.cost, {
  message: "Business Rule Violation: Price cannot be lower than cost",
  path: ["price"]
});

const validateProduct = (req, res, next) => {
  try {
    productValidationSchema.parse(req.body);
    next(); // if validation passes, move to the controller
  } catch (error) {
    // block the request and send a 400 Bad Request
    return res.status(400).json({ 
      error: "Validation Failed", 
      details: error.issues.map(err => err.message)
    });
  }
};

module.exports = { validateProduct };