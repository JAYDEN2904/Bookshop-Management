const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// API timeout configuration (30 seconds for normal requests, 60 seconds for auth)
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const AUTH_TIMEOUT = 60000; // 60 seconds for auth requests (to account for cold starts)

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  authTimeout: AUTH_TIMEOUT,
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

// Helper function to create a timeout promise
const createTimeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms. The server may be starting up. Please try again.`));
    }, timeout);
  });
};

// Helper function to make API calls with timeout
export const apiCall = async (endpoint: string, options: RequestInit = {}, timeout?: number) => {
  const url = `${apiConfig.baseURL}${endpoint}`;
  const token = localStorage.getItem('bookshop_token');
  
  // Determine timeout - use provided timeout, or check if it's an auth endpoint
  const requestTimeout = timeout || (endpoint.includes('/auth/') ? apiConfig.authTimeout : apiConfig.timeout);
  
  const headers: Record<string, string> = {
    ...apiConfig.headers,
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    const response = await Promise.race([
      fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      }),
      createTimeoutPromise(requestTimeout),
    ]);

    clearTimeout(timeoutId);

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      const errorMsg = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json().catch(() => ({ error: 'Invalid response format' }));

    // Check if response has success: false even with 200 status
    if (data.success === false) {
      const errorMsg = data.error || data.message || 'Request failed';
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: any) {
    // Handle abort/timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error(`Request timeout after ${requestTimeout}ms. The server may be starting up. Please try again.`);
    }
    
    // Handle network errors
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
    }
    
    // Re-throw other errors
    throw error;
  }
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
  getSalesReport: (params?: URLSearchParams) =>
    apiCall(`/api/reports/sales${params ? `?${params}` : ''}`),
  
  getInventoryReport: (params?: URLSearchParams) =>
    apiCall(`/api/reports/inventory${params ? `?${params}` : ''}`),
  
  getSupplierReport: (params?: URLSearchParams) =>
    apiCall(`/api/reports/suppliers${params ? `?${params}` : ''}`),
  
  getFinanceReport: (params?: URLSearchParams) =>
    apiCall(`/api/reports/finance${params ? `?${params}` : ''}`),
  
  getReports: (params?: URLSearchParams) =>
    apiCall(`/api/reports${params ? `?${params}` : ''}`),
  
  generateReport: (reportData: any) =>
    apiCall('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),
};

export default apiConfig;
