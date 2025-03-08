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

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setIsAuthenticated(true);
            if (window.location.pathname === '/login') {
                navigate('/list');
            }
        } else {
            setIsAuthenticated(false);
            navigate('/login');
        }
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