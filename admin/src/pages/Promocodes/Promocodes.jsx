import React, { useState, useEffect } from 'react';
// Replace this:
import axios from 'axios';

// With this:
import api from '../../utils/axiosConfig';

// And then use api instead of axios for your API calls:
// For example, change:
// const response = await axios.get('http://localhost:5000/api/promocodes');
// To:
// const response = await api.get('/api/promocodes');
import { toast } from 'react-toastify';
import './Promocodes.css';

const Promocodes = () => {
  const [promocodes, setPromocodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    minOrderValue: '',
    expiryDate: '',
    isWelcomeCode: false
  });

  const url = 'http://localhost:5000';
  const token = localStorage.getItem('adminToken');

  // Fetch all promocodes
  const fetchPromocodes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/promocode/list`, {
        headers: { token }
      });
      if (response.data.success) {
        setPromocodes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching promocodes:', error);
      toast.error('Failed to load promocodes');
    } finally {
      setLoading(false);
    }
  };

  const togglePromoStatus = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        `${url}/api/promocode/toggle/${id}`,
        { isActive: !currentStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(`Promocode ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchPromocodes(); // Refresh the list
      }
    } catch (error) {
      console.error('Error toggling promocode status:', error);
      toast.error(error.response?.data?.message || 'Failed to update promocode status');
    }
  };

  // Create new promocode
  const handleCreatePromocode = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.discountPercentage || !formData.expiryDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await axios.post(
        `${url}/api/promocode/create`,
        formData,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Promocode created successfully');
        setFormData({
          code: '',
          discountPercentage: '',
          minOrderValue: '',
          expiryDate: '',
          isWelcomeCode: false
        });
        fetchPromocodes();
      }
    } catch (error) {
      console.error('Error creating promocode:', error);
      toast.error(error.response?.data?.message || 'Failed to create promocode');
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchPromocodes();
  }, []);

  return (
    <div className="promocodes-container">
      <h2>Manage Promocodes</h2>

      <div className="promocodes-grid">
        <div className="promocode-form-container">
          <h3>Create New Promocode</h3>
          <form onSubmit={handleCreatePromocode} className="promocode-form">
            <div className="form-group">
              <label>Promocode*</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. WELCOME20"
              />
            </div>

            <div className="form-group">
              <label>Discount Percentage (%)*</label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                placeholder="e.g. 20"
                min="1"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Minimum Order Value (₹)</label>
              <input
                type="number"
                name="minOrderValue"
                value={formData.minOrderValue}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Expiry Date*</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isWelcomeCode"
                  checked={formData.isWelcomeCode}
                  onChange={handleChange}
                />
                Welcome Code (first-time users only)
              </label>
            </div>

            <button type="submit" className="create-btn">
              Create Promocode
            </button>
          </form>
        </div>

        <div className="promocodes-list-container">
          <h3>All Promocodes</h3>
          {loading ? (
            <p>Loading promocodes...</p>
          ) : promocodes.length > 0 ? (
            <div className="promocodes-list">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Min. Order</th>
                    <th>Expiry Date</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {promocodes.map(promo => (
                    <tr key={promo._id}>
                      <td>{promo.code}</td>
                      <td>{promo.discountPercentage}%</td>
                      <td>₹{promo.minOrderValue}</td>
                      <td>{formatDate(promo.expiryDate)}</td>
                      <td>{promo.isWelcomeCode ? 'Welcome' : 'Regular'}</td>
                      <td>
                        <div className="status-toggle">
                          <span className={`status ${promo.isActive ? 'active' : 'inactive'}`}>
                            {promo.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            className={`toggle-btn ${promo.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => togglePromoStatus(promo._id, promo.isActive)}
                          >
                            {promo.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No promocodes found</p>
          )}
        </div>
    </div>
    </div >
  );
};

export default Promocodes;