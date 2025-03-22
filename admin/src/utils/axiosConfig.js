import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Function to handle logout and redirect
const handleTokenExpiration = () => {
  console.log('Token expired, forcing logout');
  
  // Show toast notification
  toast.error('Your admin session has expired. Please login again.');
  
  // Clear local storage
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminInfo');
  
  // Force redirect to login page
  setTimeout(() => {
    window.location.replace('/login');
  }, 1000);
};

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('Interceptor caught error:', error);
    
    // Check if the error is due to an expired token
    if (error.response && 
        (error.response.status === 401 || 
         (error.response.data && 
          (error.response.data.message === "jwt expired" || 
           (typeof error.response.data.message === 'string' && 
            error.response.data.message.includes("expired")))))) {
      
      handleTokenExpiration();
    }
    
    return Promise.reject(error);
  }
);

// Also check for token expiration on request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        // Try to parse the token to check if it's valid
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          handleTokenExpiration();
          return Promise.reject('Token expired');
        }
        
        config.headers.token = token;
      } catch (e) {
        // If token is invalid, handle as expired
        handleTokenExpiration();
        return Promise.reject('Invalid token');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a global check that runs periodically
const startTokenExpirationChecker = () => {
  setInterval(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        // Try to parse the token to check if it's valid
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          handleTokenExpiration();
        }
      } catch (e) {
        // If token is invalid, handle as expired
        handleTokenExpiration();
      }
    }
  }, 10000); // Check every 10 seconds
};

// Start the token checker
startTokenExpirationChecker();

export default api;