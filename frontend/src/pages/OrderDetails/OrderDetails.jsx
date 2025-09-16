import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StoreContext } from '../../Context/StoreContext';
import { getImageUrl } from '../../utils/imageUtils';
import './OrderDetails.css';
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback';

const OrderDetails = () => {
  const { orderId } = useParams();
  const { url, token, currency } = useContext(StoreContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          `${url}/api/order/details`, 
          { orderId }, 
          { headers: { token } }
        );
        
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError('Failed to load order details');
          toast.error(response.data.message || 'Failed to load order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Error loading order details. Please try again later.');
        toast.error(error.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, token, url]);

  const canCancelOrder = (status) => {
    return ["pending", "Order Received", "Order Confirmed", "In Kitchen Queue"].includes(status)
      && status !== "Cancelled";
  };

  const handleCancel = async () => {
    try {
      const response = await axios.post(
        `${url}/api/order/status`,
        {
          orderId,
          status: "Cancelled"
        },
        { headers: { token } }
      );
      
      if (response.data.success) {
        toast.success("✅ Order cancelled successfully");
        setOrder({...order, status: "Cancelled"});
      } else {
        toast.error(response.data.message || "❌ Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(error.response?.data?.message || "Error cancelling order");
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "Order Received": return "📦";
      case "Preparing Food": return "👨‍🍳";
      case "Food Ready": return "✨";
      case "Ready for Pickup": return "🔔";
      case "Collected": return "✅";
      case "Cancelled": return "❌";
      case "Awaiting Payment Verification": return "💳";
      case "Order Confirmed": return "✔️";
      case "In Kitchen Queue": return "⏳";
      case "Waiting for Collection": return "🕒";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="order-details-loading">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/myorders" className="btn-back">Return to My Orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-error">
        <h2>Order Not Found</h2>
        <p>The requested order could not be found.</p>
        <Link to="/myorders" className="btn-back">Return to My Orders</Link>
      </div>
    );
  }

  return (
    <div className="order-details-container">
      <div className="order-details-header">
        <Link to="/myorders" className="btn-back">← Back to Orders</Link>
        <h1>Order Details</h1>
        <p className="order-id">Order ID: {order._id}</p>
      </div>

      <div className="order-details-content">
        <div className="order-status-section">
          <h2>Status</h2>
          <p className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {getStatusIcon(order.status)} {order.status}
          </p>
          
          {order.orderType && (
            <p className="order-type">
              <strong>Order Type:</strong> {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
            </p>
          )}
          
          {order.scheduledTime && (
            <p className="scheduled-time">
              <strong>Scheduled For:</strong> {new Date(order.scheduledTime).toLocaleString()}
            </p>
          )}
          
          <p className="order-date">
            <strong>Ordered On:</strong> {new Date(order.createdAt).toLocaleString()}
          </p>
          
          {canCancelOrder(order.status) && (
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel Order
            </button>
          )}
        </div>

        <div className="order-items-section">
          <h2>Order Items</h2>
          <div className="order-items-list">
            {order.items && order.items.map((item, index) => (
              <div className="order-item" key={index}>
                {item.image && (
                  <div className="order-item-image">
                    <ImageWithFallback src={item.image} alt={item.name} />
                  </div>
                )}
                <div className="order-item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">{currency}{item.price} × {item.quantity}</p>
                  <p className="item-total">{currency}{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-payment-section">
          <h2>Payment Details</h2>
          <div className="payment-info">
            <p className={`payment-type ${order.isPartialPayment ? 'partial' : 'full'}`}>
              {order.isPartialPayment ? 'Partial Payment (40%)' : 'Full Payment'}
            </p>
            
            <div className="payment-breakdown">
              <p>
                <span>Subtotal:</span>
                <span>{currency}{order.amount.toFixed(2)}</span>
              </p>
              
              {order.discountAmount > 0 && (
                <p className="discount">
                  <span>Discount:</span>
                  <span>-{currency}{order.discountAmount.toFixed(2)}</span>
                </p>
              )}
              
              {order.promocodeUsed && (
                <p className="promocode">
                  <span>Promocode:</span>
                  <span>{order.promocodeUsed}</span>
                </p>
              )}
              
              <hr />
              
              {order.isPartialPayment ? (
                <>
                  <p className="paid-amount">
                    <span>Paid:</span>
                    <span>{currency}{order.paidAmount?.toFixed(2)}</span>
                  </p>
                  <p className="remaining-amount">
                    <span>Remaining:</span>
                    <span>{currency}{order.remainingAmount?.toFixed(2)}</span>
                  </p>
                </>
              ) : (
                <p className="total">
                  <span>Total Paid:</span>
                  <span>{currency}{order.amount.toFixed(2)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;