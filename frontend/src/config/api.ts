const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      me: '/api/auth/me',
    },
    users: '/api/users',
    books: '/api/books',
    students: '/api/students',
    suppliers: '/api/suppliers',
    purchases: '/api/purchases',
    reports: '/api/reports',
    storage: '/api/storage',
  },
};

export default apiConfig;
