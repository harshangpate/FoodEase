import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import axios from 'axios'
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';

const MyOrders = () => {
  const [data, setData] = useState([]);
  const { url, token, currency } = useContext(StoreContext);

  const fetchOrders = async () => {
    const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
    setData(response.data.data)
  }
  const handleCancel = async (orderId) => {
    try {
      const response = await axios.post(
        `${url}/api/order/status`,  // Use the same endpoint as admin
        {
          orderId,
          status: "Cancelled"
        },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Order cancelled successfully");
        fetchOrders(); // Refresh orders list
      } else {
        toast.error(response.data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(error.response?.data?.message || "Error cancelling order");
    }
  };
  const canCancelOrder = (status) => {
    // Only allow cancellation for specific statuses
    return ["pending", "Food Processing"].includes(status) && status !== "Cancelled";
  };
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token])
  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => {
          return (
            <div key={order._id} className='my-orders-order'>
              <img src={assets.parcel_icon} alt="" />
              <p>{order.items.map((item, index) => {
                if (index === order.items.length - 1) {
                  return item.name + " x " + item.quantity
                }
                else {
                  return item.name + " x " + item.quantity + ", "
                }
              })}</p>
              <p>{currency}{order.amount}.00</p>
              <p>Items: {order.items.length}</p>
              <p><span>&#x25cf;</span> <b>{order.status}</b></p>
              <div className="order-actions">
                <button onClick={fetchOrders}>Track Order</button>
                {canCancelOrder(order.status) && (
                  <button 
                    onClick={() => handleCancel(order._id)}
                    className="cancel-btn"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyOrders
