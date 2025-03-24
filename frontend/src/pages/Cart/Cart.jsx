import React, { useContext, useState } from 'react'
import './Cart.css'
import { StoreContext } from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Cart = () => {

  const {cartItems, food_list, removeFromCart,getTotalCartAmount,url,currency,deliveryCharge} = useContext(StoreContext);
  const navigate = useNavigate();

  const [promocode, setPromocode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoStatus, setPromoStatus] = useState('');

  // function to validate promocode
  const validatePromocode = async () => {
    if (!promocode.trim()) {
      setPromoMessage('please enter a promocode');
      setPromoStatus('error');
      return;
    }
    try {
      const response = await axios.post(`${url}/api/promocode/validate`,{
        code: promocode,
        orderAmount: getTotalCartAmount()
      });
      if (response.data.success){
        // Store the percentage
        setDiscountPercentage(response.data.data.discountPercentage);
        
        // Calculate the actual discount amount based on the percentage
        setDiscount(parseFloat(response.data.data.discountAmount));
        
        setPromoMessage('Promocode applied successfully! ');
        setPromoStatus('success');
      }
    } 
    catch (error) {
      setDiscount(0);
      setDiscountPercentage(0);
      setPromoMessage(error.response?.data?.message || 'Invalid promocode');
      setPromoStatus('error');
    }
  };

  // calculate final amount after discount
  const getFinalAmount= () => {
    const total = getTotalCartAmount();
    return total - discount > 0 ? total - discount : 0;
  };
  
  // Add this function to calculate the total with delivery charge
  const getTotalWithDelivery = () => {
    return getFinalAmount() + (getTotalCartAmount() === 0 ? 0 : deliveryCharge);
  };
  return (
    <div className='cart'>
      {food_list.every(item => !cartItems[item._id] || cartItems[item._id] === 0) ? (
        <div className="empty-cart">
          <h2>🛒 Your cart is empty</h2>
          <p>Looks like you haven't added anything yet! 😊</p>
          <button onClick={() => navigate('/')}>
            🍽️ Browse Menu
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            <div className="cart-items-title">
              <p>Items</p> <p>Title</p> <p>Price</p> <p>Quantity</p> <p>Total</p> <p>Remove</p>
            </div>
            <br />
            <hr />
            {food_list.map((item, index) => {
              if (cartItems[item._id]>0) {
                return (<div key={index}>
                  <div className="cart-items-title cart-items-item">
                    <img src={url+"/images/"+item.image} alt="" />
                    <p>{item.name}</p>
                    <p>{currency}{item.price}</p>
                    <div>{cartItems[item._id]}</div>
                    <p>{currency}{item.price*cartItems[item._id]}</p>
                    <p className='cart-items-remove-icon' onClick={()=>removeFromCart(item._id)}>x</p>
                  </div>
                  <hr />
                </div>)
              }
            })}
          </div>
          <div className="cart-bottom">
            <div className="cart-total">
              <h2>Cart Totals</h2>
              <div>
                <div className="cart-total-details"><p>Subtotal</p><p>{currency}{getTotalCartAmount()}</p></div>
                <hr />
                {discount > 0 && (
                  <>
                    <div className="cart-total-details discount">
                    <p>Discount ({discountPercentage}% off)</p>
                      <p>-{currency}{discount}</p>
                    </div>
                    <hr />
                  </>
                )}
                <div className="cart-total-details">
                  <p>platform Fee</p>
                  <p>{currency}{getTotalCartAmount()===0?0:deliveryCharge}</p>
                </div>
                <hr />
                <div className="cart-total-details">
                  <b>Total</b>
                  <b>{currency}{getTotalCartAmount()===0?0:getTotalWithDelivery()}</b>
                </div>
              </div>
              <button onClick={() => navigate('/order', { 
                state: 
                { 
                  discountAmount: discount, 
                  promocode: discount > 0 ? promocode : '',
                  finalAmount: getFinalAmount(),
                  includesDeliveryCharge: false // Add this flag to indicate delivery charge is NOT included
                }})}>
                  PROCEED TO CHECKOUT
              </button>
            </div>
            <div className="cart-promocode">
              <div>
                <p>🎫 If you have a promo code, Enter it here</p>
                <div className='cart-promocode-input'>
                  <input 
                    type="text" 
                    placeholder='promo code' 
                    value={promocode}
                    onChange={(e) => setPromocode(e.target.value)}
                  />
                  <button onClick={validatePromocode}>Apply</button>
                </div>
                {promoMessage && (
                  <p className={`promocode-message ${promoStatus}`}>
                    {promoMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Cart