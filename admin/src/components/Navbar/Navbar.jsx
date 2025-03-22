import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminInfo')
      
      // Update authentication state
      setIsAuthenticated(false)
      
      // Show success message
      toast.success('Logged out successfully')
      
      // Navigate to login
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error during logout')
    }
  }

  return (
    <div className='navbar'>
      <img className='logo' src={assets.logo} alt="" />
      <img className='profile' src={assets.profile_image} alt="" />
      <div className='navbar-menu'>
        <button onClick={handleLogout} className='logout-button'>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Navbar
