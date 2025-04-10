import React, { useEffect, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets, url, currency } from '../../assets/assets';

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [referenceId, setReferenceId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      const newStatus = event.target.value;

      if (order.status === "Cancelled") {
        toast.error("Cannot update status of cancelled orders");
        event.target.value = "Cancelled";
        return;
      }

      if (order.status === "Awaiting Payment Verification" && newStatus === "Order Received") {
        await handleVerification(orderId);
      }

      const response = await axios.post(
        `${url}/api/order/status`,
        {
          orderId,
          status: newStatus,
          updateUser: true,
          allowCancel: ["Pending Payment", "Order Received", "Order Confirmed", "In Kitchen Queue"].includes(newStatus)
        },
        { headers: { token: localStorage.getItem('adminToken') } }
      );

      if (response.data.success) {
        toast.success("✅ Status updated successfully");
        await fetchAllOrders();
      } else {
        toast.error("❌ Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Error updating order status");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleVerification = async (orderId) => {
    try {
      if (!referenceId.trim()) {
        toast.error('⚠️ Please enter the UPI Reference ID');
        return;
      }

      // First, check if the reference ID matches what's expected
      const checkResponse = await axios.post(
        `${url}/api/order/check-reference`,
        {
          orderId,
          referenceId: referenceId.trim()
        },
        { headers: { token: localStorage.getItem('adminToken') } }
      );

      if (!checkResponse.data.success) {
        toast.error('❌ Invalid reference ID. Please verify and try again.');
        return;
      }

      // If reference ID is valid, proceed with verification
      const response = await axios.post(
        `${url}/api/order/verify-payment`,
        {
          orderId,
          referenceId: referenceId.trim(),
          paymentStatus: 'completed'
        },
        { headers: { token: localStorage.getItem('adminToken') } }
      );

      if (response.data.success) {
        toast.success('💰 Payment verified successfully');
        setReferenceId('');
        setSelectedOrder(null);
        fetchAllOrders();
      } else {
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('❌ Invalid reference ID. Please verify and try again.');
    }
  };

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      
      <div className="payment-verification-section">
        <h4>Payment Verification</h4>
        {orders
          .filter(order => order.status === "Awaiting Payment Verification")
          .map(order => (
            <div key={order._id} className="order-item">
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
                <div className="order-type-info">
                  <span className={`order-type ${order.orderType}`}>
                    {order.orderType?.charAt(0).toUpperCase() + order.orderType?.slice(1)} Order
                  </span>
                  {order.scheduledTime && (
                    <span className="scheduled-time">
                      Scheduled: {new Date(order.scheduledTime).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className='order-item-name'>{order.address.firstName + " " + order.address.lastName}</p>
                <p>Amount: {currency}{order.amount}</p>
              </div>
              <div className="verification-actions">
                <input
                  type="text"
                  placeholder="Enter UPI Reference ID"
                  value={selectedOrder === order._id ? referenceId : ''}
                  onChange={(e) => {
                    setReferenceId(e.target.value);
                    setSelectedOrder(order._id);
                  }}
                />
                <button
                  onClick={() => handleVerification(order._id)}
                  className="verify-button"
                  disabled={!referenceId.trim()}
                >
                  Verify Payment
                </button>
              </div>
            </div>
          ))}
        {orders.filter(order => order.status === "Awaiting Payment Verification").length === 0 && (
          <p>No orders pending payment verification</p>
        )}
      </div>

      <div className="order-list">
        <h4>All Orders</h4>
        {orders
          .filter(order => order.status !== "Awaiting Payment Verification")
          .map((order) => (
            <div key={order._id} className='order-item'>
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
                <div className="order-type-info">
                  <span className={`order-type ${order.orderType}`}>
                    {order.orderType?.charAt(0).toUpperCase() + order.orderType?.slice(1)} Order
                  </span>
                  {order.scheduledTime && (
                    <span className="scheduled-time">
                      Scheduled: {new Date(order.scheduledTime).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className='order-item-name'>{order.address.firstName + " " + order.address.lastName}</p>
                <div className='order-item-address'>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p className='order-item-phone'>{order.address.phone}</p>
                {/* Payment info display section */}
                <div className="payment-info">
                  {order.isPartialPayment ? (
                    <>
                      <p className="payment-type partial">Partial Payment (40%)</p>
                      <p className="payment-amount">
                        Paid: {currency}{order.paidAmount?.toFixed(2) || (order.amount * 0.4).toFixed(2)}
                      </p>
                      <p className="payment-amount remaining">
                        Remaining: {currency}{order.remainingAmount?.toFixed(2) || (order.amount * 0.6).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="payment-type full">Full Payment</p>
                  )}
                </div>
              </div>
              <p>Items: {order.items.length}</p>
              <p>{currency}{order.amount}</p>
              <select
                onChange={(e) => statusHandler(e, order._id)}
                value={order.status || 'Order Received'}
                name="status"
                className={`status-select ${order.status?.toLowerCase().replace(' ', '-')}`}
              >
                {order.status === "Awaiting Payment Verification" && (
                  <option value="Pending Payment">Pending Payment</option>
                )}
                <option value="Order Received">Order Received</option>
                <option value="Order Confirmed">Order Confirmed</option>
                <option value="In Kitchen Queue">In Kitchen Queue</option>
                <option value="Preparing Food">Preparing Food</option>
                <option value="Food Ready">Food Ready</option>
                <option value="Ready for Pickup">Ready for Pickup</option>
                <option value="Waiting for Collection">Waiting for Collection</option>
                <option value="Collected">Collected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        {orders.filter(order => order.status !== "Awaiting Payment Verification").length === 0 && (
          <p>No verified orders available</p>
        )}
      </div>
    </div>
  );
};

export default Order;
