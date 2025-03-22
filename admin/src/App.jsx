import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import AdminLogin from './pages/Login/AdminLogin'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import Promocodes from './pages/Promocodes/Promocodes';
// Import the axios config to apply interceptors
import './utils/axiosConfig';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    // Inside your App component, update the useEffect
    useEffect(() => {
        const checkTokenValidity = () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setIsAuthenticated(false);
                if (window.location.pathname !== '/login') {
                    navigate('/login');
                }
                return;
            }
            
            try {
                // Try to parse the token to check if it's valid
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                
                // Check if token is expired
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    console.log('Token expired in App.jsx check');
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminInfo');
                    setIsAuthenticated(false);
                    navigate('/login');
                    return;
                }
                
                setIsAuthenticated(true);
                if (window.location.pathname === '/login') {
                    navigate('/list');
                }
            } catch (e) {
                // If token is invalid, handle as expired
                console.error('Invalid token:', e);
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminInfo');
                setIsAuthenticated(false);
                navigate('/login');
            }
        };
        
        // Check immediately
        checkTokenValidity();
        
        // And set up interval to check periodically
        const interval = setInterval(checkTokenValidity, 10000);
        
        return () => clearInterval(interval);
    }, [navigate]);

    const renderContent = () => {
        if (!isAuthenticated) {
            return (
                <>
                    <Routes>
                        <Route path="/login" element={<AdminLogin />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </>
            );
        }

        return (
            <div className='app'>
                <Navbar setIsAuthenticated={setIsAuthenticated} />
                <hr />
                <div className="app-content">
                    <Sidebar />
                    <Routes>
                        <Route path="/" element={<Navigate to="/list" />} />
                        <Route path="/add" element={<Add />} />
                        <Route path="/list" element={<List />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/promocodes" element={<Promocodes />} />
                        <Route path="*" element={<Navigate to="/list" />} />
                    </Routes>
                </div>
            </div>
        );
    };

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <AuthProvider>
                {renderContent()}
            </AuthProvider>
        </>
    );
};

export default App;