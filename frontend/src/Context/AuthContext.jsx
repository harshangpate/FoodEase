import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Check if user is logged in on component mount
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
            headers: {
              token: token
            }
          });
          
          if (response.data.success) {
            setCurrentUser(response.data.user);
          } else {
            // Handle invalid token
            localStorage.removeItem('token');
            setToken('');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          // Handle error, clear token if needed
          localStorage.removeItem('token');
          setToken('');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        const userToken = response.data.token;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        
        // Fetch user profile after login
        const profileResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          headers: {
            token: userToken
          }
        });
        
        if (profileResponse.data.success) {
          setCurrentUser(profileResponse.data.user);
        }
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setCurrentUser(null);
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/register`, userData);
      
      if (response.data.success) {
        // Auto login after registration
        return await login(userData.email, userData.password);
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  // Context value
  const value = {
    currentUser,
    token,
    loading,
    login,
    logout,
    register,
    setToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;