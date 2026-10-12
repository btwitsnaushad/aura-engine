import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// centralized api calls for clean components
export const getInventory = (page = 1, limit = 50, search = '') => {
  return api.get(`/inventory?page=${page}&limit=${limit}&search=${search}`);
};

export const getAnalytics = () => {
  return api.get('/analytics');
};

export default api;