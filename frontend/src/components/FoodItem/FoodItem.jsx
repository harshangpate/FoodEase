import React, { useContext, useState } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/StoreContext';


const FoodItem = ({ image, name, price, desc , id }) => {

    const [itemCount, setItemCount] = useState(0);
    const {cartItems, addToCart, removeFromCart, url, currency, token} = useContext(StoreContext);

    const handleLoginClick = () => {
        // Scroll to top smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Show login popup after a small delay to ensure scroll completes
        setTimeout(() => {
            window.setShowLogin(true);
        }, 300);
    };

    return (
        <div className='food-item'>
            <div className='food-item-img-container'>
                <img className='food-item-image' src={url+"/images/"+image} alt="" />
                {token ? (
                    cartItems && (!cartItems[id]
                    ? <img className='add' onClick={() => addToCart(id)} src={assets.add_icon_white} alt="" />
                    : <div className="food-item-counter">
                        <img src={assets.remove_icon_red} onClick={()=>removeFromCart(id)} alt="" />
                        <p>{cartItems[id]}</p>
                        <img src={assets.add_icon_green} onClick={()=>addToCart(id)} alt="" />
                      </div>
                    )
                ) : (
                    <div className="login-required">
                        <span onClick={handleLoginClick} className="login-btn">Login to add</span>
                    </div>
                )}
            </div>
            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p>
                </div>
                <p className="food-item-desc">{desc}</p>
                <p className="food-item-price">{currency}{price}</p>
            </div>
        </div>
    )
}

export default FoodItem
