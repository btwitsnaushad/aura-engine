
import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Hexagon,
  Database,
  AlertTriangle,
  Tags,
  Calendar,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

const COLORS = [
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
];

const Dashboard = ({ isDarkMode = true }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
  const textColor = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';
  const chartGrid = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipBg = isDarkMode ? '#0f172a' : '#ffffff';

  // Fetch the latest analytics from the backend.
  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await getAnalytics();

      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
      setError('Unable to load analytics. Check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value || 0);

  const formatNumber = (value) =>
    new Intl.NumberFormat('en-US').format(value || 0);

  if (loading && !analytics) {
    return (
      <div style={{ color: textColor, padding: '24px' }}>
        Loading analytics...
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div style={{ color: textColor, padding: '24px' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={fetchAnalytics}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            background: '#3b82f6',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const kpis = analytics.kpis || {};
  const pieData = (analytics.portfolioDistribution || []).map((item) => ({
    name: item._id || 'Uncategorized',
    value: item.categoryValue || 0,
  }));

  const lowStockProducts = analytics.riskAssessment || [];

 
  // Keep the chart values consistent with the inventory records.
  const distributionData = lowStockProducts.map((product) => ({
    name: product.productName || 'Unnamed Product',
    count: Number(product.stockQuantity) || 0,
  }));


  // Historical values are not available from the current analytics API.
  // Show a current-value snapshot instead of inventing historical figures.
  const trendData = [
    {
      name: 'Current',
      value: kpis.totalInventoryValue || 0,
    },
  ];

  const cardStyle = {
    background: cardBg,
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${borderColor}`,
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const tooltipStyle = {
    background: tooltipBg,
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    color: textColor,
  };

  const kpiCards = [
    {
      title: 'Total SKUs',
      value: formatNumber(kpis.totalSKUs),
      note: 'Products in inventory',
      icon: Hexagon,
      color: '#3b82f6',
      iconBg: isDarkMode ? '#1e3a8a' : '#dbeafe',
    },
    {
      title: 'Total Inventory Value',
      value: formatCurrency(kpis.totalInventoryValue),
      note: 'Current stock value',
      icon: Database,
      color: '#10b981',
      iconBg: isDarkMode ? '#064e3b' : '#d1fae5',
    },
    {
      title: 'Out of Stock',
      value: formatNumber(kpis.outOfStock),
      note: 'Products with zero stock',
      icon: AlertTriangle,
      color: '#ef4444',
      iconBg: isDarkMode ? '#7f1d1d' : '#fee2e2',
    },
    {
      title: 'Categories',
      value: formatNumber(pieData.length),
      note: 'Product categories',
      icon: Tags,
      color: '#8b5cf6',
      iconBg: isDarkMode ? '#4c1d95' : '#ede9fe',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        color: textColor,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '28px',
              fontWeight: 700,
              color: textColor,
            }}
          >
            Business Analytics Overview
          </h2>
          <p style={{ margin: 0, color: textMuted, fontSize: '14px' }}>
            Insights from your inventory data
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: textMuted,
              fontSize: '12px',
            }}
          >
            <Calendar size={17} />
            <span>
              Last updated
              <br />
              <strong style={{ color: textColor }}>
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : 'Not available'}
              </strong>
            </span>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontWeight: 600,
            }}
          >
            <RefreshCw size={16} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>
          {error} Showing the last successfully loaded data.
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {kpiCards.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    background: item.iconBg,
                    padding: '12px',
                    borderRadius: '10px',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={23} color={item.color} />
                </div>

                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: '13px',
                      color: textMuted,
                    }}
                  >
                    {item.title}
                  </p>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: 'clamp(18px, 2vw, 23px)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {item.value}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: textMuted,
                    }}
                  >
                    {item.note}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        <section style={cardStyle}>
          <h3 style={{ margin: '0 0 18px', fontSize: '16px' }}>
            Inventory Value by Category
          </h3>

          {pieData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: textMuted }}>No category data available.</p>
          )}
        </section>

        <section style={cardStyle}>
          <h3 style={{ margin: '0 0 18px', fontSize: '16px' }}>
            Current Inventory Value
          </h3>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartGrid}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={textMuted}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke={textMuted}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) =>
                  `$${(value / 1000000).toFixed(0)}M`
                }
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Inventory Value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>

          <p style={{ margin: 0, color: textMuted, fontSize: '12px' }}>
            Historical trends require dated inventory snapshots.
          </p>
        </section>

        <section style={cardStyle}>
          <h3 style={{ margin: '0 0 18px', fontSize: '16px' }}>
            Lowest Stock Products
          </h3>

          {distributionData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={distributionData}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartGrid}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke={textMuted}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={textMuted}
                  width={110}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="count"
                  name="Stock Quantity"
                  fill="#3b82f6"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: textMuted }}>No stock risk data available.</p>
          )}
        </section>
      </div>

      <section style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>
          Low Stock Overview
        </h3>

        {lowStockProducts.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                  {['Product', 'Category', 'Stock Quantity', 'Status'].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding: '12px',
                          color: textMuted,
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr
                    key={product._id}
                    style={{ borderBottom: `1px solid ${borderColor}` }}
                  >
                    <td style={{ padding: '12px' }}>
                      {product.productName}
                    </td>
                    <td style={{ padding: '12px', color: textMuted }}>
                      {product.category}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {product.stockQuantity}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          color: '#f59e0b',
                          background: isDarkMode ? '#422006' : '#fef3c7',
                          padding: '5px 9px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: textMuted }}>
            No low-stock products to display.
          </p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
