
const Product = require('../models/Product');

const getAnalytics = async (req, res) => {
  try {
    const [analyticsResult, lowStockProducts] = await Promise.all([
      Product.aggregate([
        {
          $match: {
            price: { $type: 'number' },
            stockQuantity: { $type: 'number', $gte: 0 }
          }
        },
        {
          $facet: {
            kpis: [
              {
                $match: {
                  cost: { $type: 'number' }
                }
              },
              {
                $group: {
                  _id: null,
                  totalSKUs: { $sum: 1 },
                  totalInventoryValue: {
                    $sum: {
                      $multiply: ['$price', '$stockQuantity']
                    }
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
            ],
            portfolioDistribution: [
              {
                $match: {
                  category: { $exists: true, $ne: '' }
                }
              },
              {
                $group: {
                  _id: '$category',
                  categoryValue: {
                    $sum: {
                      $multiply: ['$price', '$stockQuantity']
                    }
                  }
                }
              },
              {
                $project: {
                  _id: 1,
                  categoryValue: 1
                }
              }
            ]
          }
        }
      ]),
      Product.find({ stockQuantity: { $gt: 0 } })
        .sort({ stockQuantity: 1, productName: 1 })
        .limit(10)
        .select('productName stockQuantity category')
        .lean()
    ]);

    const analytics = analyticsResult[0] || {};

    res.json({
      kpis: analytics.kpis?.[0] || {
        totalSKUs: 0,
        totalInventoryValue: 0,
        outOfStock: 0
      },
      riskAssessment: lowStockProducts,
      portfolioDistribution: analytics.portfolioDistribution || []
    });
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data'
    });
  }
};

module.exports = { getAnalytics };
