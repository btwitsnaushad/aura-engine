import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Added category and sort parameters for advanced filtering
export const getInventory = (page = 1, limit = 15, search = '', category = '', sort = '-lastUpdated') => {
  return api.get(`/inventory?page=${page}&limit=${limit}&search=${search}&category=${category}&sort=${sort}`);
};

export const getAnalytics = () => {
  return api.get('/analytics');
};

export default api;