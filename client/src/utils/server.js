import axios from "axios";

const baseURL = "http://localhost:5000";

// Create an Axios instance
const api = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Important for cookies
});

// Handle tokens in requests
api.interceptors.request.use((config) => {
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
    // Handle common errors here if needed
    return Promise.reject(error);
  }
);

export default api;