
const Product = require('../models/Product');

const getAnalytics = async (req, res) => {
  const requestStart = Date.now();

  try {
    console.log('[Analytics] Request started');

    const [analyticsResult, lowStockProducts] = await Promise.all([
      (async () => {
        const aggregationStart = Date.now();

        const result = await Product.aggregate([
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
        ]);

        console.log(
          `[Analytics] Aggregation time: ${Date.now() - aggregationStart} ms`
        );

        return result;
      })(),

      (async () => {
        const lowStockStart = Date.now();

        const result = await Product.find({
          stockQuantity: { $gt: 0 }
        })
          .sort({ stockQuantity: 1, productName: 1 })
          .limit(10)
          .select('productName stockQuantity category')
          .lean();

        console.log(
          `[Analytics] Low-stock query time: ${Date.now() - lowStockStart} ms`
        );

        return result;
      })()
    ]);

    const analytics = analyticsResult[0] || {};

    const responseData = {
      kpis: analytics.kpis?.[0] || {
        totalSKUs: 0,
        totalInventoryValue: 0,
        outOfStock: 0
      },
      riskAssessment: lowStockProducts,
      portfolioDistribution: analytics.portfolioDistribution || []
    };

    console.log(
      `[Analytics] Total controller time: ${Date.now() - requestStart} ms`
    );

    return res.json(responseData);
  } catch (error) {
    console.error(
      `[Analytics] Failed after ${Date.now() - requestStart} ms:`,
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch analytics data'
    });
  }
};

module.exports = { getAnalytics };
