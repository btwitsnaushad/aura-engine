
const Product = require('../models/Product');

const getAnalytics = async (req, res) => {
  try {
    // Run analytics queries concurrently.
    const [kpiStats, lowStockProducts, categoryDistribution] =
      await Promise.all([
        // 1. Calculate inventory KPIs using MongoDB aggregation.
        Product.aggregate([
          {
            $match: {
              price: { $type: 'number' },
              cost: { $type: 'number' },
              stockQuantity: { $type: 'number', $gte: 0 }
            }
          },
          {
            $project: {
              price: 1,
              stockQuantity: 1
            }
          },
          {
            $group: {
              _id: null,
              totalSKUs: { $sum: 1 },
              totalInventoryValue: {
                $sum: { $multiply: ['$price', '$stockQuantity'] }
              },
              outOfStock: {
                $sum: {
                  $cond: [
                    { $eq: ['$stockQuantity', 0] },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              totalSKUs: 1,
              totalInventoryValue: 1,
              outOfStock: 1
            }
          }
        ]),

        // 2. Find the 10 products with the lowest positive stock.
        Product.find({ stockQuantity: { $gt: 0 } })
          .sort({ stockQuantity: 1, productName: 1 })
          .limit(10)
          .select('productName stockQuantity category')
          .lean(),

        // 3. Calculate inventory value for each category.
        Product.aggregate([
          {
            $match: {
              category: { $exists: true, $ne: '' },
              price: { $type: 'number' },
              stockQuantity: { $type: 'number', $gte: 0 }
            }
          },
          {
            $project: {
              category: 1,
              price: 1,
              stockQuantity: 1
            }
          },
          {
            $group: {
              _id: '$category',
              categoryValue: {
                $sum: { $multiply: ['$price', '$stockQuantity'] }
              }
            }
          },
          {
            $project: {
              _id: 1,
              categoryValue: 1
            }
          }
        ])
      ]);

    // Keep the response structure compatible with the dashboard.
    res.json({
      kpis: kpiStats[0] || {
        totalSKUs: 0,
        totalInventoryValue: 0,
        outOfStock: 0
      },
      riskAssessment: lowStockProducts,
      portfolioDistribution: categoryDistribution
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data'
    });
  }
};

module.exports = { getAnalytics };
