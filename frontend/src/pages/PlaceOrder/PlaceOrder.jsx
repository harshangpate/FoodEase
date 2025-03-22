import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../Context/StoreContext'
import { assets } from '../../assets/assets';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
const PlaceOrder = () => {
    const { getTotalCartAmount, cartItems, setCartItems, food_list, url, token, currency } = useContext(StoreContext);
    const navigate = useNavigate();
    const location = useLocation();
    const deliveryCharge = 5;

    const discountAmount = location.state?.discountAmount || 0;
    const promocode = location.state?.promocode || '';
    const includesDeliveryCharge = location.state?.includesDeliveryCharge || false;

    // Update initial state
    const [paymentMethod, setPaymentMethod] = useState('online'); // Change 'full' to 'online'
    const [qrCode, setQrCode] = useState(null);
    const [referenceId, setReferenceId] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [orderType, setOrderType] = useState('regular');
    const [scheduledTime, setScheduledTime] = useState('');
    const [timeLeft, setTimeLeft] = useState(300);
    const [timerInterval, setTimerInterval] = useState(null);
    
    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        phone: ""
    });

    const calculatePaymentAmount = () => {
        // Start with the base amount (already discounted)
        let baseAmount = getTotalCartAmount() - discountAmount;
        
        // Add delivery charge if not already included
        if (!includesDeliveryCharge) {
            baseAmount += deliveryCharge;
        }
        
        // Add rush charges if applicable
        if (orderType === 'rush') {
            baseAmount += 20;
        }
        
        // Calculate partial payment if needed
        return paymentMethod === 'partial' ? (baseAmount * 0.4).toFixed(2) : baseAmount.toFixed(2);
    };

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData(data => ({ ...data, [name]: value }));
    };

    useEffect(() => {
        if (qrCode && timeLeft > 0) {
            const interval = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(interval);
                        setQrCode(null);
                        setReferenceId(null);
                        setOrderId(null);
                        toast.error("⏰ Payment time expired. Please generate new QR code.");
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [qrCode, timeLeft]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            toast.error("👋 Please login first");
            return;
        }
    
        let orderItems = [];
        food_list.forEach((item) => {
            if (cartItems[item._id] > 0) {
                orderItems.push({
                    _id: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: cartItems[item._id]
                });
            }
        });

        // Calculate the actual subtotal directly from cart items
        let calculatedSubtotal = 0;
        food_list.forEach((item) => {
            if (cartItems[item._id] > 0) {
                calculatedSubtotal += item.price * cartItems[item._id];
            }
        });
        
        console.log("Calculated subtotal:", calculatedSubtotal);
        console.log("getTotalCartAmount():", getTotalCartAmount());
        console.log("discountAmount:", discountAmount);

        // Use the calculated subtotal instead of getTotalCartAmount()
        const subtotal = calculatedSubtotal;
        const discountedSubtotal = Math.max(0, subtotal - discountAmount);
        
        const orderData = {
            address: data,
            items: orderItems,
            amount: subtotal, // Send the actual subtotal, not the discounted amount
            discountAmount: discountAmount,
            promocodeUsed: promocode,
            orderType: orderType,
            scheduledTime: orderType === 'scheduled' ? scheduledTime : null
        };

        try {
            const response = await axios.post(
                `${url}/api/order/place`, 
                orderData, 
                { headers: { token } }
            );
            if (response.data.success) {
                setQrCode(response.data.qrCode);
                setReferenceId(response.data.referenceId);
                setOrderId(response.data.orderId);
                setTimeLeft(300);
            }
        } catch (error) {
            console.error("Order error:", error);
            toast.error(error.response?.data?.message || "😕 Something went wrong");
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <form onSubmit={handleSubmit} className='place-order'>
            <div className="place-order-left">
                <p className='title'>Delivery Information</p>
                <div className="multi-field">
                    <input type="text" name='firstName' onChange={onChangeHandler} value={data.firstName} placeholder='First name' required />
                    <input type="text" name='lastName' onChange={onChangeHandler} value={data.lastName} placeholder='Last name' required />
                </div>
                <input type="email" name='email' onChange={onChangeHandler} value={data.email} placeholder='Email address' required />
                <input type="text" name='street' onChange={onChangeHandler} value={data.street} placeholder='Street' required />
                <div className="multi-field">
                    <input type="text" name='city' onChange={onChangeHandler} value={data.city} placeholder='City' required />
                    <input type="text" name='state' onChange={onChangeHandler} value={data.state} placeholder='State' required />
                </div>
                <div className="multi-field">
                    <input type="text" name='zipcode' onChange={onChangeHandler} value={data.zipcode} placeholder='Zip code' required />
                    <input type="text" name='country' onChange={onChangeHandler} value={data.country} placeholder='Country' required />
                </div>
                <input type="text" name='phone' onChange={onChangeHandler} value={data.phone} placeholder='Phone' required />
            </div>
            <div className="place-order-right">
                <div className="order-type">
                    <h2>Order Type</h2>
                    <div className="order-type-options">
                        <div onClick={() => setOrderType('regular')} className="payment-option">
                            <img src={orderType === 'regular' ? assets.checked : assets.un_checked} alt="" />
                            <p>Regular Order</p>
                        </div>
                        <div onClick={() => setOrderType('rush')} className="payment-option">
                            <img src={orderType === 'rush' ? assets.checked : assets.un_checked} alt="" />
                            <p>Rush Order (+₹20)</p>
                        </div>
                        <div onClick={() => setOrderType('scheduled')} className="payment-option">
                            <img src={orderType === 'scheduled' ? assets.checked : assets.un_checked} alt="" />
                            <p>Schedule for Later</p>
                        </div>
                    </div>
                    
                    {orderType === 'scheduled' && (
                        <div className="scheduled-time">
                            <input 
                                type="datetime-local" 
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                required={orderType === 'scheduled'}
                            />
                        </div>
                    )}
                </div>

                <div className="cart-total">
                    <h2>Cart Totals</h2>
                    <div>
                        <div className="cart-total-details">
                            <p>Subtotal</p>
                            <p>{currency}{getTotalCartAmount()}</p>
                        </div>
                        
                        {/* Add discount display if discount exists */}
                        {discountAmount > 0 && (
                            <div className="cart-total-details">
                                <p>Discount {promocode && `(${promocode})`}</p>
                                <p>-{currency}{discountAmount}</p>
                            </div>
                        )}
                        
                        <div className="cart-total-details">
                            <p>Pickup Charge</p>
                            <p>{currency}{getTotalCartAmount() === 0 ? 0 : deliveryCharge}</p>
                        </div>
                        
                        {orderType === 'rush' && (
                            <div className="cart-total-details">
                                <p>Rush Order Fee</p>
                                <p>{currency}20</p>
                            </div>
                        )}
                        
                        <hr />
                        
                        <div className="cart-total-details">
                            <b>Total</b>
                            <b>{currency}{
                                getTotalCartAmount() === 0 
                                ? 0 
                                : (getTotalCartAmount() - discountAmount) + (includesDeliveryCharge ? 0 : deliveryCharge) + (orderType === 'rush' ? 20 : 0)
                            }</b>
                        </div>
                        
                        {paymentMethod === 'partial' && (
                            <>
                                <div className="cart-total-details">
                                    <p>Advance Payment (40%)</p>
                                    <p>{currency}{calculatePaymentAmount()}</p>
                                </div>
                                <div className="cart-total-details">
                                    <p>Remaining at Pickup (60%)</p>
                                    <p>{currency}{
                                        (((getTotalCartAmount() - discountAmount) + deliveryCharge + (orderType === 'rush' ? 20 : 0)) * 0.6).toFixed(2)
                                    }</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="payment">
                    <h2>Payment Method</h2>
                    <div onClick={() => setPaymentMethod('online')} className="payment-option">
                        <img src={paymentMethod === 'online' ? assets.checked : assets.un_checked} alt="" />
                        <p>Pay Online (Full Payment)</p>
                    </div>
                    <div onClick={() => setPaymentMethod('partial')} className="payment-option">
                        <img src={paymentMethod === 'partial' ? assets.checked : assets.un_checked} alt="" />
                        <p>Partial Payment (40% Online + 60% at Pickup)</p>
                    </div>

                    {paymentMethod === 'partial' && (
                        <div className="payment-warning">
                            <p>⚠️ Please note:</p>
                            <ul>
                                <li>40% advance payment is non-refundable if order is not collected</li>
                                <li>Remaining 60% must be paid during pickup</li>
                                <li>Orders must be collected within the specified time</li>
                            </ul>
                        </div>
                    )}

                    {qrCode && (
                        <div className="qr-payment">
                            <div className="payment-info">
                                <h3>Payment Details</h3>
                                <p>Amount: {currency}{calculatePaymentAmount()}</p>
                                <p>Reference ID: {referenceId}</p>
                                <p className="timer">Time remaining: {formatTime(timeLeft)}</p>
                            </div>
                            
                            <div className="qr-container">
                                <img src={qrCode} alt="Payment QR Code" />
                                <p>Scan with any UPI app</p>
                            </div>

                            <button 
                                className="view-orders-btn" 
                                type="button"
                                onClick={() => {
                                    // In the button onClick handler
                                    navigate('/myorders'); // Change from '/my-orders' to '/myorders'
                                    setTimeout(() => {
                                        setCartItems({});
                                    }, 0);
                                }}
                            >
                                View Your Orders
                            </button>
                        </div>
                    )}
                </div>
                <button className='place-order-submit' type='submit'>
                    {qrCode ? "Generate New QR" : "Place Order"}
                </button>
            </div>
        </form>
    );
};

export default PlaceOrder;
