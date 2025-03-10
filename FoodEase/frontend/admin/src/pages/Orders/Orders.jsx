import React, { useEffect, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets, url, currency } from '../../assets/assets';

const Order = () => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
        setOrders(response.data.data.reverse());
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error loading orders");
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const order = orders.find(o => o._id === orderId);
      
      // Don't allow status changes for cancelled orders
      if (order.status === "Cancelled") {
        toast.error("Cannot update status of cancelled orders");
        event.target.value = "Cancelled"; // Reset select value
        return;
      }

      const response = await axios.post(
        `${url}/api/order/status`, 
        {
          orderId,
          status: event.target.value
        },
        { headers: { token: localStorage.getItem('adminToken') } }
      );
      
      if (response.data.success) {
        toast.success("Status updated successfully");
        await fetchAllOrders(); // Refresh orders list
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Error updating order status");
    }
  };
  useEffect(() => {
    fetchAllOrders();
  }, [])
  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index) => (
          <div key={order._id} className='order-item'>  {/* Changed key to order._id */}
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className='order-item-food'>
                {order.items.map((item, index) => {
                  if (index === order.items.length - 1) {
                    return item.name + " x " + item.quantity
                  }
                  else {
                    return item.name + " x " + item.quantity + ", "
                  }
                })}
              </p>
              <p className='order-item-name'>{order.address.firstName + " " + order.address.lastName}</p>
              <div className='order-item-address'>
                <p>{order.address.street + ","}</p>
                <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
              </div>
              <p className='order-item-phone'>{order.address.phone}</p>
            </div>
            <p>Items : {order.items.length}</p>
            <p>{currency}{order.amount}</p>
            <select 
              onChange={(e) => statusHandler(e, order._id)} 
              value={order.status || 'Food Processing'} 
              name="status"
            >
              <option value="pending">Pending</option>
              <option value="Food Processing">Food Processing</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Order;
