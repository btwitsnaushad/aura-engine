
import { useState, useEffect, useCallback } from 'react';
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
} from 'recharts';
import {
  Package,
  Database,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

const Dashboard = ({ isDarkMode = true }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const colors = {
    background: isDarkMode ? '#0f172a' : '#f8fafc',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    grid: isDarkMode ? '#334155' : '#e2e8f0',
    tooltip: isDarkMode ? '#0f172a' : '#ffffff',
  };

  // Initial loading is already true, so this function only updates state
  // after the asynchronous request settles. This avoids synchronous state
  // updates from the mounting effect.
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await getAnalytics();
      setAnalytics(response.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
      setError(
        'Unable to load analytics. Please check the backend connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError('');
    await fetchAnalytics();
  }, [fetchAnalytics]);

 useEffect(() => {
  let isMounted = true;

  const loadDashboard = async () => {
    try {
      const response = await getAnalytics();

      if (isMounted) {
        setAnalytics(response.data);
        setLastUpdated(new Date());
        setError('');
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);

      if (isMounted) {
        setError(
          'Unable to load analytics. Please check the backend connection.'
        );
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadDashboard();

  return () => {
    isMounted = false;
  };
}, []);

  const formatNumber = (value) =>
    new Intl.NumberFormat('en-US').format(Number(value) || 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  // Use a compact value in the KPI card to prevent text wrapping.
  const formatCompactCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const cardStyle = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: '14px',
    padding: '22px',
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const tooltipStyle = {
    backgroundColor: colors.tooltip,
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    color: colors.text,
    padding: '10px 14px',
  };

  if (loading && !analytics) {
    return (
      <div
        role="status"
        style={{
          color: colors.text,
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        Loading dashboard analytics...
      </div>
    );
  }

  if (!analytics && error) {
    return (
      <div
        style={{
          ...cardStyle,
          color: colors.text,
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <AlertTriangle size={32} color="#ef4444" />
        <p>{error}</p>
        <button
          type="button"
          onClick={handleRefresh}
          style={{
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '11px 18px',
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
    value: Number(item.categoryValue) || 0,
  }));

  // The backend returns products ordered by their lowest positive stock.
  const lowStockProducts = (analytics.riskAssessment || [])
    .slice()
    .sort(
      (a, b) =>
        Number(a.stockQuantity) - Number(b.stockQuantity)
    )
    .slice(0, 10);

  const kpiCards = [
    {
      title: 'Total SKUs',
      value: formatNumber(kpis.totalSKUs),
      note: 'Products in inventory',
      icon: Package,
      color: '#60a5fa',
      iconBg: isDarkMode ? '#1e3a8a' : '#dbeafe',
    },
    {
      title: 'Total Inventory Value',
      value: formatCompactCurrency(kpis.totalInventoryValue),
      note: 'Current stock value',
      icon: Database,
      color: '#34d399',
      iconBg: isDarkMode ? '#064e3b' : '#d1fae5',
      fullValue: formatCurrency(kpis.totalInventoryValue),
    },
    {
      title: 'Out of Stock',
      value: formatNumber(kpis.outOfStock),
      note: 'Products with zero stock',
      icon: AlertTriangle,
      color: '#f87171',
      iconBg: isDarkMode ? '#7f1d1d' : '#fee2e2',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        color: colors.text,
      }}
    >
      {/* Dashboard heading and refresh controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(23px, 2.2vw, 30px)',
              lineHeight: 1.3,
              fontWeight: 750,
              margin: '0 0 8px',
              letterSpacing: '-0.6px',
            }}
          >
            Business Analytics Overview
          </h1>
          <p
            style={{
              margin: 0,
              color: colors.muted,
              fontSize: '14px',
            }}
          >
            Insights from your inventory data
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              color: colors.muted,
              fontSize: '12px',
            }}
          >
            <Calendar size={17} />
            <div>
              <div>Last updated</div>
              <strong
                style={{
                  display: 'block',
                  color: colors.text,
                  marginTop: '3px',
                }}
              >
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : 'Not available'}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9px',
              padding: '11px 17px',
              fontSize: '13px',
              fontWeight: 650,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: loading ? 'dashboard-spin 1s linear infinite' : 'none',
              }}
            />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            border: '1px solid #ef4444',
            borderRadius: '9px',
            color: '#f87171',
            fontSize: '13px',
          }}
        >
          {error} Showing the last successfully loaded data.
        </div>
      )}

      {/* Inventory KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        {kpiCards.map((item) => {
          const Icon = item.icon;

          return (
            <section
              key={item.title}
              style={{
                ...cardStyle,
                minHeight: '145px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}
              title={item.fullValue || undefined}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: item.iconBg,
                  borderRadius: '11px',
                }}
              >
                <Icon size={23} color={item.color} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: '3px 0 10px',
                    color: colors.muted,
                    fontSize: '13px',
                  }}
                >
                  {item.title}
                </p>

                <h2
                  style={{
                    margin: '0 0 9px',
                    fontSize: 'clamp(21px, 2vw, 26px)',
                    lineHeight: 1.25,
                    fontWeight: 750,
                    letterSpacing: '-0.5px',
                    overflowWrap: 'normal',
                  }}
                >
                  {item.value}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: colors.muted,
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {item.note}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      {/* Category distribution and low-stock charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '20px',
          marginBottom: '24px',
          alignItems: 'stretch',
        }}
      >
        <section style={{ ...cardStyle, minHeight: '390px' }}>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            Inventory Value by Category
          </h2>
          <p
            style={{
              margin: '0 0 14px',
              color: colors.muted,
              fontSize: '12px',
            }}
          >
            Distribution of current inventory value
          </p>

          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={96}
                    paddingAngle={3}
                    stroke={colors.card}
                    strokeWidth={2}
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
                    itemStyle={{ color: colors.text }}
                    labelStyle={{ color: colors.text }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '10px 16px',
                  marginTop: '4px',
                }}
              >
                {pieData.map((item, index) => (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '12px',
                      color: colors.muted,
                      maxWidth: '100%',
                    }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        flexShrink: 0,
                        borderRadius: '3px',
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: colors.muted, fontSize: '13px' }}>
              No category data available.
            </p>
          )}
        </section>

        <section style={{ ...cardStyle, minHeight: '390px' }}>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            Lowest Stock Products
          </h2>
          <p
            style={{
              margin: '0 0 14px',
              color: colors.muted,
              fontSize: '12px',
            }}
          >
            Products with the lowest available stock
          </p>

          {lowStockProducts.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={lowStockProducts}
                layout="vertical"
                margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
              >
                <CartesianGrid
                  stroke={colors.grid}
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  stroke={colors.muted}
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: colors.border }}
                />

                <YAxis
                  type="category"
                  dataKey="productName"
                  width={120}
                  stroke={colors.muted}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) =>
                    value && value.length > 19
                      ? `${value.slice(0, 17)}...`
                      : value
                  }
                  interval={0}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: colors.text }}
                  formatter={(value) => [
                    formatNumber(value),
                    'Stock Quantity',
                  ]}
                />

                <Bar
                  dataKey="stockQuantity"
                  name="Stock Quantity"
                  fill="#3b82f6"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: colors.muted, fontSize: '13px' }}>
              No low-stock products available.
            </p>
          )}
        </section>
      </div>

      <style>
        {`
          @keyframes dashboard-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
