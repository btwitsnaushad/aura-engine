import { useState, useEffect } from 'react';
import { getInventory } from '../services/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search, Filters and Sorting states
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-lastUpdated');

  // Client Requirement: 500ms Debounce to prevent API spam on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // reset to first page when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data whenever page, search, category, or sort changes
  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      try {
        const { data } = await getInventory(page, 15, debouncedSearch, category, sort);
        setProducts(data.data);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, [page, debouncedSearch, category, sort]);

  // Client Requirement: Export currently filtered table data to CSV blob
  const exportToCSV = () => {
    if (products.length === 0) return;
    const headers = 'SKU,Product Name,Category,Price,Stock\n';
    const csvRows = products.map(p => `${p.sku},"${p.productName}",${p.category},${p.price},${p.stockQuantity}\n`);
    
    const blob = new Blob([headers + csvRows.join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Aura_Inventory_Export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '20px', color: '#e2e8f0', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2>Inventory Management</h2>
        
        {/* Controls Toolbar */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }}
          />
          
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '4px', background: '#1e293b', color: 'white', border: '1px solid #475569' }}>
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel">Apparel</option>
            <option value="Home">Home</option>
            <option value="Office">Office</option>
            <option value="Sports">Sports</option>
            <option value="Toys">Toys</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: '#1e293b', color: 'white', border: '1px solid #475569' }}>
            <option value="-lastUpdated">Newest First</option>
            <option value="-price">Price: High to Low</option>
            <option value="price">Price: Low to High</option>
            <option value="stockQuantity">Stock: Low to High</option>
          </select>

          <button onClick={exportToCSV} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#0f172a' }}>
            <tr>
              <th style={{ padding: '15px', borderBottom: '1px solid #334155' }}>SKU</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #334155' }}>Product Name</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #334155' }}>Category</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #334155' }}>Price</th>
              <th style={{ padding: '15px', borderBottom: '1px solid #334155' }}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading products...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No products found.</td></tr>
            ) : (
              products.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px 15px', color: '#94a3b8' }}>{item.sku}</td>
                  <td style={{ padding: '12px 15px' }}>{item.productName}</td>
                  <td style={{ padding: '12px 15px' }}><span style={{ background: '#334155', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>{item.category}</span></td>
                  <td style={{ padding: '12px 15px' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '12px 15px', color: item.stockQuantity < 50 ? '#ef4444' : '#10b981' }}>{item.stockQuantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: page === 1 ? '#334155' : '#3b82f6', color: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: page === totalPages ? '#334155' : '#3b82f6', color: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Inventory;