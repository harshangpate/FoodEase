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
        toast.success("✅ Order cancelled successfully");
        fetchOrders(); // Refresh orders list
      } else {
        toast.error(response.data.message || "❌ Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(error.response?.data?.message || "Error cancelling order");
    }
  };
  // Update the canCancelOrder function
  const canCancelOrder = (status) => {
    return ["pending", "Order Received", "Order Confirmed", "In Kitchen Queue"].includes(status)
      && status !== "Cancelled";
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
        {data && data.length > 0 ? (
          data.map((order, index) => {
            return (
              <div key={order._id} className='my-orders-order'>
                <img src={assets.parcel_icon} alt="" />
                <div className="order-details">
                  <p>{order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return item.name + " x " + item.quantity
                    }
                    else {
                      return item.name + " x " + item.quantity + ", "
                    }
                  })}</p>
                  <div className="order-type-info">
                    <span className={`order-type ${order.orderType}`}>
                      {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)} Order
                    </span>
                    {order.scheduledTime && (
                      <span className="scheduled-time">
                        Scheduled: {new Date(order.scheduledTime).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p>{currency}{order.amount}.00</p>
                  {order.discountAmount > 0 && (
                    <p className="discount-info">
                      Discount: -{currency}{order.discountAmount}
                      {order.promocodeUsed && ` (${order.promocodeUsed})`}
                    </p>
                  )}
                  <p>Items: {order.items.length}</p>
                  <p><span>&#x25cf;</span> <b>
                    {order.status === "Order Received" && "📦 "}
                    {order.status === "Preparing Food" && "👨‍🍳 "}
                    {order.status === "Food Ready" && "✨ "}
                    {order.status === "Ready for Pickup" && "🔔 "}
                    {order.status === "Collected" && "✅ "}
                    {order.status === "Cancelled" && "❌ "}
                    {order.status === "Awaiting Payment Verification" && "💳 "}
                    {order.status === "Order Confirmed" && "✔️ "}
                    {order.status === "In Kitchen Queue" && "⏳ "}
                    {order.status === "Waiting for Collection" && "🕒 "}
                    {order.status}
                  </b></p>
                </div>
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
          })
        ) : (
          <p>📭 No orders found</p>
        )}
      </div>
    </div>
  )
}

export default MyOrders
