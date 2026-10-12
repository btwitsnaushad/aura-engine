import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch aggregated data on component mount
    const fetchAnalytics = async () => {
      try {
        const { data } = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading Analytics Data...</div>;
  if (!analytics) return <div style={{ padding: '20px' }}>Error loading data from server.</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Business Analytics Overview</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '8px', minWidth: '220px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total SKUs</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{analytics.kpis.totalSKUs.toLocaleString()}</p>
        </div>
        
        <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '8px', minWidth: '220px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Inventory Value</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            ${analytics.kpis.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div style={{ padding: '20px', background: '#fee2e2', borderRadius: '8px', minWidth: '220px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#991b1b' }}>Out of Stock</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#dc2626' }}>{analytics.kpis.outOfStock}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;