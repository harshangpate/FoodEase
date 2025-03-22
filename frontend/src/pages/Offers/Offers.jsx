import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { StoreContext } from '../../Context/StoreContext';
import { useNavigate } from 'react-router-dom';
import './Offers.css';

const Offers = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { url, currency } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromocodes = async () => {
      try {
        const response = await axios.get(`${url}/api/promocode/active`);
        if (response.data.success) {
          setPromocodes(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching promocodes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromocodes();
  }, [url]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="offers-container">
      <div className="offers-header">
        <h1>Special Offers & Promocodes</h1>
        <p>Use these promocodes at checkout to save on your orders!</p>
      </div>

      {loading ? (
        <div className="loading">Loading available offers...</div>
      ) : promocodes.length > 0 ? (
        <div className="promocodes-grid">
          {promocodes.map((promo) => (
            <div className="promo-card" key={promo._id}>
              <div className="promo-code">{promo.code}</div>
              <div className="promo-details">
                <h3>Save {promo.discountPercentage}% on your order</h3>
                {promo.minOrderValue > 0 && (
                  <p>Minimum order: {currency}{promo.minOrderValue}</p>
                )}
                <p className="expiry">Valid until: {formatDate(promo.expiryDate)}</p>
              </div>
              <button 
                className="use-promo-btn"
                onClick={() => navigate('/cart')}
              >
                Order Now
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-offers">
          <h2>No active offers at the moment</h2>
          <p>Check back soon for new deals!</p>
          <button onClick={() => navigate('/')}>Browse Menu</button>
        </div>
      )}
    </div>
  );
};

export default Offers;