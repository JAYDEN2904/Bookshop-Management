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
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to make API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${apiConfig.baseURL}${endpoint}`;
  const token = localStorage.getItem('bookshop_token');
  
  const headers: Record<string, string> = {
    ...apiConfig.headers,
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// API methods
export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  logout: () => apiCall('/api/auth/logout', { method: 'POST' }),
  
  getCurrentUser: () => apiCall('/api/auth/me'),

  // Users
  getUsers: (params?: URLSearchParams) =>
    apiCall(`/api/users${params ? `?${params}` : ''}`),
  
  getUser: (id: string) => apiCall(`/api/users/${id}`),
  
  createUser: (userData: any) =>
    apiCall('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  updateUser: (id: string, userData: any) =>
    apiCall(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  deleteUser: (id: string) =>
    apiCall(`/api/users/${id}`, { method: 'DELETE' }),

  // Books
  getBooks: (params?: URLSearchParams) =>
    apiCall(`/api/books${params ? `?${params}` : ''}`),
  
  getBook: (id: string) => apiCall(`/api/books/${id}`),
  
  createBook: (bookData: any) =>
    apiCall('/api/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    }),
  
  updateBook: (id: string, bookData: any) =>
    apiCall(`/api/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    }),
  
  deleteBook: (id: string) =>
    apiCall(`/api/books/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params?: URLSearchParams) =>
    apiCall(`/api/students${params ? `?${params}` : ''}`),
  
  getStudent: (id: string) => apiCall(`/api/students/${id}`),
  
  createStudent: (studentData: any) =>
    apiCall('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),
  
  updateStudent: (id: string, studentData: any) =>
    apiCall(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    }),
  
  deleteStudent: (id: string) =>
    apiCall(`/api/students/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: (params?: URLSearchParams) =>
    apiCall(`/api/suppliers${params ? `?${params}` : ''}`),
  
  getSupplier: (id: string) => apiCall(`/api/suppliers/${id}`),
  
  createSupplier: (supplierData: any) =>
    apiCall('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    }),
  
  updateSupplier: (id: string, supplierData: any) =>
    apiCall(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    }),
  
  deleteSupplier: (id: string) =>
    apiCall(`/api/suppliers/${id}`, { method: 'DELETE' }),

  // Purchases
  getPurchases: (params?: URLSearchParams) =>
    apiCall(`/api/purchases${params ? `?${params}` : ''}`),
  
  getPurchase: (id: string) => apiCall(`/api/purchases/${id}`),
  
  createPurchase: (purchaseData: any) =>
    apiCall('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    }),
  
  updatePurchase: (id: string, purchaseData: any) =>
    apiCall(`/api/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(purchaseData),
    }),
  
  deletePurchase: (id: string) =>
    apiCall(`/api/purchases/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (params?: URLSearchParams) =>
    apiCall(`/api/reports${params ? `?${params}` : ''}`),
  
  generateReport: (reportData: any) =>
    apiCall('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),
};

export default apiConfig;
