// utils/server.js
import axios from "axios";
const baseURL = "http://localhost:5000";

// Create an Axios instance
const api = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Important for cookies
});

// Request interceptor to add auth token if available
api.interceptors.request.use((config) => {
  // Get token from localStorage or cookie
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Handle content type
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      window.location.href = '/login';
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message;
    console.error('API Error:', errorMessage);
    
    return Promise.reject(error);
  }
);

export default api;