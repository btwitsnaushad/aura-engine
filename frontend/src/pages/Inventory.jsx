import { useState, useEffect, useMemo } from 'react';
import { getInventory } from '../services/api';
import {
  Search,
  Eye,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';

const PAGE_SIZE = 50;

const colors = {
  page: '#0f172a',
  panel: '#1e293b',
  panelDeep: '#111c30',
  border: '#334155',
  text: '#f8fafc',
  muted: '#94a3b8',
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#f87171',
};

const categoryColors = {
  Apparel: '#60a5fa',
  Home: '#34d399',
  Office: '#fbbf24',
  Sports: '#a78bfa',
  Toys: '#f472b6',
  Electronics: '#22d3ee',
};

const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const controlStyle = {
  width: '100%',
  minWidth: 0,
  minHeight: '42px',
  padding: '10px 12px',
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  background: colors.panel,
  color: colors.text,
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonBase = {
  minHeight: '42px',
  padding: '0 14px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'background 160ms ease, border-color 160ms ease',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: '#cbd5e1',
  fontSize: '12px',
  fontWeight: 600,
};

const cellStyle = {
  padding: '15px 16px',
  borderBottom: `1px solid ${colors.border}`,
  verticalAlign: 'middle',
};

const headerCellStyle = {
  ...cellStyle,
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: colors.panelDeep,
  color: '#aebbd0',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.045em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const SortHeader = ({ field, children, onSort, indicator }) => (
  <th
    scope="col"
    onClick={() => onSort(field)}
    title={`Sort by ${children}`}
    style={{
      ...headerCellStyle,
      cursor: 'pointer',
      userSelect: 'none',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      {children}
      <span aria-hidden="true" style={{ color: colors.blue, fontSize: 13 }}>
        {indicator}
      </span>
    </span>
  </th>
);

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-lastUpdated');
  const [stockThreshold, setStockThreshold] = useState(20);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Required 500 ms debounce for global search.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // The API fetches a maximum of 50 records for each page.
  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getInventory(
          page,
          PAGE_SIZE,
          debouncedSearch,
          category,
          sort
        );

        if (cancelled) return;

        const payload = response?.data ?? {};
        const rows = Array.isArray(payload.data) ? payload.data : [];

        setProducts(rows);
        setTotalPages(Math.max(1, Number(payload.totalPages) || 1));
        setTotalRecords(Math.max(0, Number(payload.totalRecords) || 0));
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch inventory:', err);
          setProducts([]);
          setTotalPages(1);
          setTotalRecords(0);
          setError(
            err?.response?.data?.message ||
              'Inventory could not be loaded. Check that the backend server is running.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, sort, retryCount]);

  const invalidPriceRange =
    minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice);

  // These UI-only filters apply to the currently fetched page.
  // To filter all 50,000 records, the backend route must accept these filters too.
  const filteredProducts = useMemo(() => {
    if (invalidPriceRange) return [];

    return products.filter((product) => {
      const stock = Number(product.stockQuantity) || 0;
      const price = Number(product.price) || 0;

      const stockMatches =
        stockThreshold >= 100 || stock < Number(stockThreshold);
      const minMatches = minPrice === '' || price >= Number(minPrice);
      const maxMatches = maxPrice === '' || price <= Number(maxPrice);

      return stockMatches && minMatches && maxMatches;
    });
  }, [products, stockThreshold, minPrice, maxPrice, invalidPriceRange]);

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCategory('');
    setSort('-lastUpdated');
    setStockThreshold(20);
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  const exportToCSV = () => {
    if (filteredProducts.length === 0) return;

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Price',
      'Cost',
      'Stock Quantity',
      'Reorder Level',
      'Last Updated',
    ];

    const rows = filteredProducts.map((product) =>
      [
        product.sku,
        product.productName,
        product.category,
        product.price,
        product.cost,
        product.stockQuantity,
        product.reorderLevel,
        product.lastUpdated,
      ]
        .map(escapeCSV)
        .join(',')
    );

    const blob = new Blob(
      [[headers.map(escapeCSV).join(','), ...rows].join('\r\n')],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'Aura_Engine_Inventory.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const changeSort = (field) => {
    setSort((current) => {
      if (current === field) return `-${field}`;
      if (current === `-${field}`) return field;
      return field === 'lastUpdated' ? '-lastUpdated' : field;
    });
    setPage(1);
  };

  const sortIndicator = (field) => {
    if (sort === field) return '↑';
    if (sort === `-${field}`) return '↓';
    return '↕';
  };

  return (
    <section
      style={{
        width: '100%',
        minWidth: 0,
        color: colors.text,
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        .inventory-input:focus, .inventory-select:focus {
          border-color: ${colors.blue} !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
        }
        .inventory-row:hover { background: rgba(59, 130, 246, 0.07); }
        .inventory-button:disabled { opacity: .42; cursor: not-allowed; }
        .inventory-scroll { overflow: auto; max-width: 100%; max-height: 66vh; }
        .inventory-scroll::-webkit-scrollbar { height: 9px; width: 9px; }
        .inventory-scroll::-webkit-scrollbar-thumb { background: #475569; border-radius: 8px; }
        @media (max-width: 900px) {
          .inventory-toolbar { grid-template-columns: 1fr !important; }
          .inventory-filters { grid-template-columns: 1fr !important; }
          .inventory-footer { align-items: flex-start !important; flex-direction: column !important; }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 7,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 11,
                background: 'rgba(59,130,246,.15)',
                color: '#60a5fa',
              }}
            >
              <Package size={21} />
            </div>
            <h1 style={{ margin: 0, fontSize: 25, letterSpacing: '-0.035em' }}>
              Inventory Management
            </h1>
          </div>
          <p style={{ margin: '0 0 0 50px', color: colors.muted, fontSize: 13 }}>
            Search, filter and manage your product inventory
          </p>
        </div>

        <div
          style={{
            padding: '9px 12px',
            border: `1px solid ${colors.border}`,
            borderRadius: 9,
            background: colors.panel,
            color: colors.muted,
            fontSize: 12,
          }}
        >
          {totalRecords.toLocaleString()} total records
          <span style={{ margin: '0 8px', color: '#475569' }}>•</span>
          50 records per page
        </div>
      </div>

      <div
        style={{
          padding: 18,
          marginBottom: 16,
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: 13,
          boxShadow: '0 8px 24px rgba(2, 6, 23, .10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
          <SlidersHorizontal size={16} color="#60a5fa" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Search & filters</span>
        </div>

        <div
          className="inventory-toolbar"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 2fr) minmax(145px, 1fr) minmax(155px, 1fr)',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <div>
            <label htmlFor="inventory-search" style={labelStyle}>
              Search products
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={17}
                color={colors.muted}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="inventory-search"
                className="inventory-input"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setDebouncedSearch(searchInput.trim());
                    setPage(1);
                  }
                }}
                placeholder="Search by product name or SKU..."
                style={{ ...controlStyle, paddingLeft: 39 }}
              />
            </div>
            <div style={{ marginTop: 5, color: '#64748b', fontSize: 11 }}>
              Search updates after 500 ms
            </div>
          </div>

          <div>
            <label htmlFor="inventory-category" style={labelStyle}>
              Category
            </label>
            <select
              id="inventory-category"
              className="inventory-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              style={controlStyle}
            >
              <option value="">All categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Sports">Sports</option>
              <option value="Toys">Toys</option>
            </select>
          </div>

          <div>
            <label htmlFor="inventory-sort" style={labelStyle}>
              Sort results
            </label>
            <select
              id="inventory-sort"
              className="inventory-select"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              style={controlStyle}
            >
              <option value="-lastUpdated">Recently updated</option>
              <option value="-price">Price: high to low</option>
              <option value="price">Price: low to high</option>
              <option value="-stockQuantity">Stock: high to low</option>
              <option value="stockQuantity">Stock: low to high</option>
            </select>
          </div>
        </div>

        <div
          className="inventory-filters"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr) auto',
            alignItems: 'end',
            gap: 18,
            marginTop: 19,
            paddingTop: 17,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <div>
            <label
              htmlFor="stock-threshold"
              style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', gap: 8 }}
            >
              <span>Stock level</span>
              <span style={{ color: '#93c5fd' }}>
                {stockThreshold >= 100 ? 'Any stock' : `Below ${stockThreshold} units`}
              </span>
            </label>
            <input
              id="stock-threshold"
              type="range"
              min="1"
              max="100"
              step="1"
              value={stockThreshold}
              onChange={(event) => setStockThreshold(Number(event.target.value))}
              style={{ width: '100%', accentColor: colors.blue, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 10 }}>
              <span>1 unit</span>
              <span>100 = any stock</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Price range (USD)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <input
                className="inventory-input"
                aria-label="Minimum price"
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min price"
                style={controlStyle}
              />
              <input
                className="inventory-input"
                aria-label="Maximum price"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max price"
                style={controlStyle}
              />
            </div>
            {invalidPriceRange && (
              <div style={{ marginTop: 5, color: colors.red, fontSize: 11 }}>
                Minimum price cannot exceed maximum price.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="inventory-button"
              onClick={resetFilters}
              style={{
                ...buttonBase,
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                color: '#cbd5e1',
              }}
            >
              <RefreshCw size={15} />
              Reset
            </button>
            <button
              type="button"
              className="inventory-button"
              onClick={exportToCSV}
              disabled={loading || filteredProducts.length === 0 || invalidPriceRange}
              style={{
                ...buttonBase,
                background: colors.green,
                border: `1px solid ${colors.green}`,
                color: '#052e2b',
              }}
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          overflow: 'hidden',
          background: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: 13,
          boxShadow: '0 8px 24px rgba(2, 6, 23, .12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            padding: '16px 18px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Inventory records</h2>
            <p style={{ margin: '5px 0 0', color: colors.muted, fontSize: 12 }}>
              {loading ? 'Loading current page…' : `${filteredProducts.length} matching records on this page`}
            </p>
          </div>
          {loading && (
            <span style={{ color: '#93c5fd', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <RefreshCw size={14} /> Loading
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: 16,
              padding: 13,
              borderRadius: 9,
              background: 'rgba(248,113,113,.09)',
              border: '1px solid rgba(248,113,113,.3)',
              color: '#fecaca',
              fontSize: 13,
            }}
          >
            <AlertCircle size={17} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              style={{ ...buttonBase, minHeight: 34, background: '#7f1d1d', color: '#fff', border: 0 }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="inventory-scroll">
          <table
            style={{
              width: '100%',
              minWidth: 1050,
              borderCollapse: 'separate',
              borderSpacing: 0,
              textAlign: 'left',
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th scope="col" style={headerCellStyle}>SKU</th>
                <th scope="col" style={headerCellStyle}>Product name</th>
                <th scope="col" style={headerCellStyle}>Category</th>
                <SortHeader field="price" onSort={changeSort} indicator={sortIndicator("price")}>Price</SortHeader>
                <th scope="col" style={headerCellStyle}>Cost</th>
                <SortHeader field="stockQuantity" onSort={changeSort} indicator={sortIndicator("stockQuantity")}>Stock</SortHeader>
                <th scope="col" style={headerCellStyle}>Reorder level</th>
                <SortHeader field="lastUpdated" onSort={changeSort} indicator={sortIndicator("lastUpdated")}>Last updated</SortHeader>
                <th scope="col" style={{ ...headerCellStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ ...cellStyle, padding: 42, textAlign: 'center', color: colors.muted }}>
                    <RefreshCw size={20} style={{ verticalAlign: 'middle', marginRight: 9 }} />
                    Loading inventory records…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} style={{ ...cellStyle, padding: 35, textAlign: 'center', color: colors.muted }}>
                    Inventory records are unavailable.
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...cellStyle, padding: 42, textAlign: 'center' }}>
                    <Package size={25} color="#64748b" style={{ marginBottom: 10 }} />
                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>No matching products</div>
                    <div style={{ color: colors.muted, marginTop: 5, fontSize: 12 }}>
                      Try changing the search term or filters.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const categoryColor = categoryColors[product.category] || '#94a3b8';
                  const stock = Number(product.stockQuantity) || 0;
                  const reorderLevel = Number(product.reorderLevel) || 20;
                  const lowStock = stock <= reorderLevel;

                  return (
                    <tr key={product._id || product.sku} className="inventory-row">
                      <td style={{ ...cellStyle, color: '#aebbd0', fontSize: 12, maxWidth: 180, overflowWrap: 'anywhere' }}>
                        {product.sku || '—'}
                      </td>
                      <td style={{ ...cellStyle, minWidth: 180, color: colors.text, fontWeight: 600 }}>
                        {product.productName || 'Unnamed product'}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '5px 9px',
                            borderRadius: 6,
                            background: `${categoryColor}18`,
                            border: `1px solid ${categoryColor}45`,
                            color: categoryColor,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: colors.text, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {money(product.price)}
                      </td>
                      <td style={{ ...cellStyle, color: colors.muted, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {money(product.cost)}
                      </td>
                      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                        <span style={{ color: lowStock ? '#fbbf24' : '#34d399', fontWeight: 700 }}>
                          {stock.toLocaleString()}
                        </span>
                        {lowStock && (
                          <span
                            style={{
                              display: 'block',
                              marginTop: 4,
                              color: '#fbbf24',
                              fontSize: 10,
                            }}
                          >
                            Low stock
                          </span>
                        )}
                      </td>
                      <td style={{ ...cellStyle, color: colors.muted }}>
                        {reorderLevel.toLocaleString()}
                      </td>
                      <td style={{ ...cellStyle, color: colors.muted, whiteSpace: 'nowrap', fontSize: 12 }}>
                        {formatDate(product.lastUpdated)}
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <button
                          type="button"
                          title={`View ${product.productName || 'product'}`}
                          aria-label={`View ${product.productName || 'product'}`}
                          onClick={() => window.alert(
                            `Product: ${product.productName || '—'}\nSKU: ${product.sku || '—'}\nCategory: ${product.category || '—'}\nStock: ${stock}`
                          )}
                          style={{
                            display: 'inline-grid',
                            placeItems: 'center',
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            background: '#172338',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          className="inventory-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '15px 18px',
            borderTop: `1px solid ${colors.border}`,
            background: '#19263a',
          }}
        >
          <div style={{ color: colors.muted, fontSize: 12, lineHeight: 1.6 }}>
            Showing{' '}
            <strong style={{ color: colors.text }}>
              {totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalRecords)}
            </strong>{' '}
            of <strong style={{ color: colors.text }}>{totalRecords.toLocaleString()}</strong> products
            <span style={{ marginLeft: 8, color: '#64748b' }}>
              · {filteredProducts.length} visible after page filters
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="inventory-button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
              style={{
                ...buttonBase,
                minHeight: 36,
                padding: '0 11px',
                background: colors.panel,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <span style={{ color: colors.muted, fontSize: 12, minWidth: 76, textAlign: 'center' }}>
              Page <strong style={{ color: colors.text }}>{page}</strong> of {totalPages}
            </span>
            <button
              type="button"
              className="inventory-button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={loading || page >= totalPages}
              style={{
                ...buttonBase,
                minHeight: 36,
                padding: '0 11px',
                background: colors.blue,
                border: `1px solid ${colors.blue}`,
                color: '#fff',
              }}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Inventory;
