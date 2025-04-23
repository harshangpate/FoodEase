import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
            <img src={assets.logo} alt="" />
            <p>FoodEase - Simplifying campus dining at ITM (SLS) Baroda University. Our innovative canteen management system lets you browse menus, pre-order meals, and skip the lines. We're committed to enhancing your campus dining experience with convenient ordering, flexible payment options, and efficient food collection services.</p>
        </div>
        <div className="footer-content-center">
        </div>
        <div className="footer-content-right">
            <h2>GET IN TOUCH</h2>
            <ul>
                <li>+91 99999 00000</li>
                <li>support.foodease@gmail.com</li>
            </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">Copyright 2025 © foodEase - All Right Reserved.</p>
    </div>
  )
}

export default Footer
