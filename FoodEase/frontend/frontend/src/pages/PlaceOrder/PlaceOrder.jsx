import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../Context/StoreContext'
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const PlaceOrder = () => {
    const { getTotalCartAmount, cartItems, setCartItems, food_list, url, token, currency } = useContext(StoreContext);
    const navigate = useNavigate();
    const deliveryCharge = 5;

    const [payment, setPayment] = useState("cod");
    const [qrCode, setQrCode] = useState(null);
    const [referenceId, setReferenceId] = useState(null);
    const [orderId, setOrderId] = useState(null);
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

    const [timeLeft, setTimeLeft] = useState(300); // 300 seconds = 5 minutes
    const [timerInterval, setTimerInterval] = useState(null);

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setData(data => ({ ...data, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            toast.error("Please login first");
            return;
        }
    
        let orderItems = [];
        food_list.map((item) => {
            if (cartItems[item._id] > 0) {
                orderItems.push({
                    _id: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: cartItems[item._id]
                });
            }
        });
    
        const orderData = {
            address: data,
            items: orderItems,
            amount: getTotalCartAmount() + deliveryCharge,
            paymentMethod: payment,
            status: payment === "cod" ? "pending" : "awaiting_payment",
            referenceId: payment === "cod" ? `COD-${Date.now()}` : null
        };

        try {
            if (payment === "cod") {
                const response = await axios.post(
                    url + "/api/order/placecod", 
                    orderData, 
                    { headers: { token } }
                );
                if (response.data.success) {
                    setCartItems({});
                    toast.success("Order Placed Successfully");
                    setTimeout(() => {
                        navigate("/myorders");
                    }, 1000);
                }
            } else {
                const response = await axios.post(
                    url + "/api/order/place", 
                    orderData, 
                    { headers: { token } }
                );
                if (response.data.success) {
                    setQrCode(response.data.qrCode);
                    setReferenceId(response.data.referenceId);
                    setOrderId(response.data.orderId);
                    startPaymentTimer(); // Start the timer
                } else {
                    toast.error("Failed to generate payment");
                }
            }
        } catch (error) {
            console.error("Order error:", error);
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    };

    const verifyPayment = async () => {
        try {
            if (!orderId || !referenceId) {
                toast.error("Invalid order details");
                return;
            }

            const response = await axios.post(
                url + "/api/order/verify-payment",
                { 
                    orderId: orderId,
                    referenceId: referenceId,
                    amount: getTotalCartAmount() + deliveryCharge,
                    paymentMethod: "upi"
                },
                { headers: { token } }
            );

            if (response.data.success) {
                setCartItems({});
                clearInterval(timerInterval);
                toast.success("Payment verified successfully");
                setTimeout(() => {
                    navigate("/myorders");
                }, 1500);
            } else {
                toast.error(response.data.message || "Payment verification failed");
                if (response.data.message === "Payment time expired") {
                    setQrCode(null);
                    setReferenceId(null);
                    setOrderId(null);
                }
            }
        } catch (error) {
            console.error("Verification error:", error);
            toast.error("Error verifying payment");
        }
    };

    const startPaymentTimer = () => {
        setTimeLeft(300);
        const interval = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(interval);
                    setQrCode(null);
                    setReferenceId(null);
                    setOrderId(null);
                    toast.error("Payment time expired. Please generate new QR code.");
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        setTimerInterval(interval);
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
                <div className="cart-total">
                    <h2>Cart Totals</h2>
                    <div>
                        <div className="cart-total-details"><p>Subtotal</p><p>{currency}{getTotalCartAmount()}</p></div>
                        <div className="cart-total-details"><p>Delivery Charge</p><p>{currency}{getTotalCartAmount() === 0 ? 0 : deliveryCharge}</p></div>
                        <hr />
                        <div className="cart-total-details"><b>Total</b><b>{currency}{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryCharge}</b></div>
                    </div>
                </div>
                <div className="payment">
                    <h2>Payment Method</h2>
                    <div onClick={() => setPayment("cod")} className="payment-option">
                        <img src={payment === "cod" ? assets.checked : assets.un_checked} alt="" />
                        <p>Cash on Delivery</p>
                    </div>
                    <div onClick={() => setPayment("qr")} className="payment-option">
                        <img src={payment === "qr" ? assets.checked : assets.un_checked} alt="" />
                        <p>Pay via UPI</p>
                    </div>

                    {payment === "qr" && qrCode && (
                        <div className="qr-payment">
                            <div className="payment-info">
                                <h3>Payment Details</h3>
                                <p>Amount: {currency}{getTotalCartAmount() + deliveryCharge}</p>
                                <p>Reference ID: {referenceId}</p>
                                <p className="timer">Time remaining: {formatTime(timeLeft)}</p>
                            </div>
                            
                            <div className="qr-container">
                                <img src={qrCode} alt="Payment QR Code" />
                                <p>Scan with any UPI app</p>
                            </div>

                            <button 
                                type="button" 
                                onClick={verifyPayment} 
                                className="verify-btn"
                                disabled={timeLeft === 0}
                            >
                                Verify Payment
                            </button>
                        </div>
                    )}
                </div>
                <button className='place-order-submit' type='submit'>{payment === "cod" ? "Place Order" : qrCode ? "Generate New QR" : "Generate QR Code"}</button>
            </div>
        </form>
    )
}

export default PlaceOrder
