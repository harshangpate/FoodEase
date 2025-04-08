import React from 'react'
import  './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/list' className="sidebar-option">
            <img src={assets.item_list} alt="" />
            <p>Item's List </p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Orders</p>
        </NavLink>
        <NavLink to='/add' className="sidebar-option">
            <img src={assets.add_icon} alt="" />
            <p>Add Items</p>
        </NavLink>
        <NavLink to='/promocodes' className="sidebar-option">
            <img src={assets.discount_img} alt="" />
            <p>Promocodes</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
