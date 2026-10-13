import { useState, useEffect } from 'react';
import { getInventory } from '../services/api';
import { Search, Eye, RefreshCw, Download } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-lastUpdated');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      try {
        const { data } = await getInventory(page, 15, debouncedSearch, category, sort);
        setProducts(data.data);
        setTotalPages(data.totalPages);
        setTotalRecords(data.totalRecords);
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, [page, debouncedSearch, category, sort]);

  const exportToCSV = () => {
    if (products.length === 0) return;
    const headers = 'SKU,Product Name,Category,Price,Cost,Stock\n';
    const csvRows = products.map(p => `${p.sku},"${p.productName}",${p.category},${p.price},${p.cost},${p.stockQuantity}\n`);
    const blob = new Blob([headers + csvRows.join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Aura_Inventory_Export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryColor = (cat) => {
    const colors = {
      'Apparel': '#3b82f6', 'Home': '#10b981', 'Office': '#f59e0b',
      'Sports': '#8b5cf6', 'Toys': '#ec4899', 'Electronics': '#06b6d4'
    };
    return colors[cat] || '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ color: '#e2e8f0' }}>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>Inventory Management</h2>
        <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>View, search and manage your product inventory</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: 'white', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button style={{ padding: '0 20px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <RefreshCw size={16} /> Search
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Category</div>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={{ padding: '10px', borderRadius: '6px', background: '#1e293b', color: 'white', border: '1px solid #334155', outline: 'none', minWidth: '150px' }}>
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Sports">Sports</option>
              <option value="Toys">Toys</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Sort By</div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '10px', borderRadius: '6px', background: '#1e293b', color: 'white', border: '1px solid #334155', outline: 'none', minWidth: '150px' }}>
              <option value="-lastUpdated">Default</option>
              <option value="-price">Price: High to Low</option>
              <option value="price">Price: Low to High</option>
              <option value="stockQuantity">Stock: Low to High</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '10px' }}>
            <button onClick={() => { setSearchInput(''); setCategory(''); setSort('-lastUpdated'); }} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Reset
            </button>
            <button onClick={exportToCSV} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ background: '#0f172a' }}>
            <tr>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>SKU</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Product Name</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Category</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Price</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Cost</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Stock</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Reorder Level</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Last Updated</th>
              <th style={{ padding: '16px', borderBottom: '1px solid #334155', color: '#9ca3af', fontWeight: '500' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: '20px', textAlign: 'center' }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: '20px', textAlign: 'center' }}>No products found.</td></tr>
            ) : (
              products.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#334155'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', color: '#cbd5e1' }}>{item.sku}</td>
                  <td style={{ padding: '16px', color: 'white' }}>{item.productName}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ background: `${getCategoryColor(item.category)}20`, color: getCategoryColor(item.category), border: `1px solid ${getCategoryColor(item.category)}40`, padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>${item.cost ? item.cost.toFixed(2) : '0.00'}</td>
                  <td style={{ padding: '16px', color: item.stockQuantity < (item.reorderLevel || 50) ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                    {item.stockQuantity}
                  </td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>{item.reorderLevel || 20}</td>
                  <td style={{ padding: '16px', color: '#9ca3af' }}>{formatDate(item.lastUpdated || new Date())}</td>
                  <td style={{ padding: '16px' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, totalRecords)} of {totalRecords.toLocaleString()} products
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: page === 1 ? '#475569' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
            <button style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '500' }}>{page}</button>
            <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: page === totalPages ? '#475569' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;