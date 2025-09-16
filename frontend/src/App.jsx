import React, { useState, useEffect } from 'react'
import Home from './pages/Home/Home'
import Footer from './components/Footer/Footer'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Cart from './pages/Cart/Cart'
import LoginPopup from './components/LoginPopup/LoginPopup'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import MyOrders from './pages/MyOrders/MyOrders'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Verify from './pages/Verify/Verify'
import Orders from './pages/MyOrders/MyOrders';
import Offers from './pages/Offers/Offers';
import ProfilePage from './pages/Profile/ProfilePage';
import OrderDetails from './pages/OrderDetails/OrderDetails';
import { AuthProvider } from './Context/AuthContext';

const App = () => {

  const [showLogin,setShowLogin] = useState(false);
  
  // Make setShowLogin available globally
  useEffect(() => {
    window.setShowLogin = setShowLogin;
  }, []);

  return (
    <AuthProvider>
      <ToastContainer/>
      {showLogin?<LoginPopup setShowLogin={setShowLogin}/>:<></>}
      <div className='app'>
        <Navbar setShowLogin={setShowLogin}/>
        <Routes>
          <Route path='/' element={<Home />}/>
          <Route path='/cart' element={<Cart />}/>
          <Route path='/order' element={<PlaceOrder />}/>
          <Route path='/myorders' element={<MyOrders />}/> {/* Make sure this matches */}
          <Route path='/verify' element={<Verify />}/>
          <Route path="/offers" element={<Offers />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
        </Routes>
      </div>
      <Footer />
    </AuthProvider>
  )
}

export default App
