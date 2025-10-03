import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔄 API Call: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    
    if (!error.response) {
      console.error('🌐 Network error - backend may be down');
      return Promise.reject(new Error('Network error. Please check if the server is running.'));
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Report services with rating functionality
export const reportService = {
  getAll: () => api.get('/reports'),
  getById: (id) => api.get(`/reports/${id}`),
  create: (reportData) => api.post('/reports', reportData),
  
  // 🔥 FIXED: PRL Feedback endpoint - using PUT instead of POST
  addFeedback: (id, feedback) => api.put(`/reports/${id}/feedback`, { prl_feedback: feedback }),
  
  // Rating methods
  addRating: (id, ratingData) => api.post(`/reports/${id}/rate`, ratingData),
  getMyRatings: () => api.get('/reports/my-ratings'),
  getRatings: (id) => api.get(`/reports/${id}/ratings`),
  
  // 🔥 NEW: Test endpoint for debugging
  test: () => api.get('/reports/test'),
};

// Course services
export const courseService = {
  getAll: () => api.get('/courses'),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => api.put(`/courses/${id}`, courseData),
  assignLecturer: (id, assignmentData) => api.post(`/courses/${id}/assign`, assignmentData),
};

// User services
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Class services - 🔥 UPDATED: Added missing assignLecturer method
export const classService = {
  getAll: () => api.get('/classes'),
  getMyClasses: () => api.get('/classes/my-classes'),
  create: (classData) => api.post('/classes', classData),
  update: (id, classData) => api.put(`/classes/${id}`, classData),
  delete: (id) => api.delete(`/classes/${id}`),
  // 🔥 ADD THIS MISSING METHOD:
  assignLecturer: (id, assignmentData) => api.post(`/classes/${id}/assign`, assignmentData),
};

// 🔥 NEW: Test API connection
export const testConnection = async () => {
  try {
    const response = await api.get('/reports/test');
    console.log('✅ Backend connection test:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    throw error;
  }
};

export default api;