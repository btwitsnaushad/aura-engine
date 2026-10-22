
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch inventory with pagination, search, filters and sorting.
export const getInventory = (
  page = 1,
  limit = 50,
  search = '',
  category = '',
  sort = '-lastUpdated',
  filters = {}
) => {
  const params = {
    page,
    limit,
    sort,
  };

  if (search.trim()) {
    params.search = search.trim();
  }

  if (category) {
    params.category = category;
  }

  if (filters.minStock != null && filters.minStock !== '') {
    params.minStock = filters.minStock;
  }

  if (filters.maxStock != null && filters.maxStock !== '') {
    params.maxStock = filters.maxStock;
  }

  if (filters.minPrice != null && filters.minPrice !== '') {
    params.minPrice = filters.minPrice;
  }

  if (filters.maxPrice != null && filters.maxPrice !== '') {
    params.maxPrice = filters.maxPrice;
  }

  return api.get('/inventory', { params });
};

// Fetch dashboard analytics.
export const getAnalytics = () => {
  return api.get('/analytics');
};

// Export all matching inventory records as a CSV file.
export const exportInventoryCSV = (
  search = '',
  category = '',
  sort = '-lastUpdated',
  filters = {}
) => {
  const params = { sort };

  if (search.trim()) {
    params.search = search.trim();
  }

  if (category) {
    params.category = category;
  }

  if (filters.minStock != null && filters.minStock !== '') {
    params.minStock = filters.minStock;
  }

  if (filters.maxStock != null && filters.maxStock !== '') {
    params.maxStock = filters.maxStock;
  }

  if (filters.minPrice != null && filters.minPrice !== '') {
    params.minPrice = filters.minPrice;
  }

  if (filters.maxPrice != null && filters.maxPrice !== '') {
    params.maxPrice = filters.maxPrice;
  }

  return api.get('/inventory/export', {
    params,
    responseType: 'blob',
  });
};

export default api;
