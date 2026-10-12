const Product = require('../models/Product');

const getAnalytics = async (req, res) => {
  try {
    // execute all complex database aggregations concurrently for maximum speed
    const [kpiStats, lowStockProducts, categoryDistribution] = await Promise.all([
      
      // 1. KPI Metrics: Total items, Total Inventory Value, and Out of Stock count
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalSKUs: { $sum: 1 },
            totalInventoryValue: { $sum: { $multiply: ["$price", "$stockQuantity"] } },
            outOfStock: {
              $sum: { $cond: [{ $eq: ["$stockQuantity", 0] }, 1, 0] }
            }
          }
        }
      ]),

      // 2. Risk Assessment: Top 10 items with the lowest stock (excluding 0)
      Product.find({ stockQuantity: { $gt: 0 } })
        .sort({ stockQuantity: 1 })
        .limit(10)
        .select('productName stockQuantity category'),

      // 3. Portfolio Distribution: Total inventory value grouped by category
      Product.aggregate([
        {
          $group: {
            _id: "$category",
            categoryValue: { $sum: { $multiply: ["$price", "$stockQuantity"] } }
          }
        }
      ])
    ]);

    // format the response payload for frontend charting libraries
    res.json({
      kpis: kpiStats[0] || { totalSKUs: 0, totalInventoryValue: 0, outOfStock: 0 },
      riskAssessment: lowStockProducts,
      portfolioDistribution: categoryDistribution
    });

  } catch (error) {
    console.error("Error in getAnalytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};

module.exports = { getAnalytics };