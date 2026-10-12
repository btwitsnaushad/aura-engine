import { useState, useEffect } from 'react';
import { getInventory } from '../services/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // pagination and search states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // re-fetch data when page or search term changes
  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      try {
        // fetching 15 items per page for better table view
        const { data } = await getInventory(page, 15, activeSearch);
        setProducts(data.data);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [page, activeSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // reset to first page on new search
    setActiveSearch(searchInput);
  };

  return (
    <div style={{ padding: '20px', color: '#e2e8f0', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Inventory Management</h2>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #475569', background: '#1e293b', color: 'white', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
            Search
          </button>
        </form>
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
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Loading products...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No products found.</td>
              </tr>
            ) : (
              products.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px 15px', color: '#94a3b8' }}>{item.sku}</td>
                  <td style={{ padding: '12px 15px' }}>{item.productName}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px' }}>${item.price.toFixed(2)}</td>
                  <td style={{ padding: '12px 15px', color: item.stockQuantity < 50 ? '#ef4444' : '#10b981' }}>
                    {item.stockQuantity}
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
          <button 
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: page === 1 ? '#334155' : '#3b82f6', color: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          
          <span>Page {page} of {totalPages}</span>
          
          <button 
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: page === totalPages ? '#334155' : '#3b82f6', color: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;