import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    parentEmail: '',
    phone: '',
  });
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!token) {
      toast.error("Please login to view your profile");
      navigate('/');
      return;
    }

    // Generate last 12 months for report selection
    const generateMonths = () => {
      const monthsList = [];
      const today = moment();
      
      for (let i = 0; i < 12; i++) {
        const month = moment().subtract(i, 'months');
        monthsList.push({
          value: `${month.month() + 1}-${month.year()}`,
          label: month.format('MMMM YYYY')
        });
      }
      
      setMonths(monthsList);
      setSelectedMonth(monthsList[0].value);
    };
    
    generateMonths();
    
    // Load user profile data
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching profile data with token:', token);
        console.log('API URL:', import.meta.env.VITE_API_URL);
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          headers: {
            token: token
          }
        });
        
        console.log('Profile response:', response.data);
        
        if (response.data.success) {
          setProfileData(response.data.user);
          setFormData({
            name: response.data.user.name,
            email: response.data.user.email,
            parentEmail: response.data.user.parentEmail || '',
            phone: response.data.user.phone || '',
          });
        } else {
          console.error('Profile fetch returned success: false', response.data);
          setError(response.data.message || 'Failed to load profile data');
          toast.error(response.data.message || 'Failed to load profile data');
        }
      } catch (error) {
        console.error('Error fetching profile data', error);
        console.error('Error response:', error.response);
        const errorMsg = error.response?.data?.message || 'Failed to load profile data. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    
    // Load user orders
    const fetchOrders = async () => {
      try {
        console.log('Fetching orders with token:', token);
        
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/order/userorders`, {}, {
          headers: {
            token: token
          }
        });
        
        console.log('Orders response:', response.data);
        
        if (response.data.success) {
          setOrders(response.data.data || []);
        } else {
          console.error('Order fetch returned success: false', response.data);
        }
      } catch (error) {
        console.error('Error fetching orders', error);
        console.error('Error response:', error.response);
        toast.error(error.response?.data?.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
    fetchOrders();
  }, [token, navigate]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/update-profile`,
        formData,
        {
          headers: {
            token: token
          }
        }
      );
      
      setProfileData(response.data.user);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile', error);
      toast.error('Failed to update profile');
    }
  };
  
  // Handle monthly report generation
  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const [month, year] = selectedMonth.split('-');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/reports/monthly/${currentUser.id}?month=${month}&year=${year}`,
        {
          headers: {
            token: token
          }
        }
      );
      
      toast.success('Monthly report generated and sent to your email');
    } catch (error) {
      console.error('Error generating report', error);
      if (error.response && error.response.status === 404) {
        toast.info('No orders found for the selected month');
      } else {
        toast.error('Failed to generate monthly report');
      }
    } finally {
      setReportLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="profile-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="profile-error">
        <h2>Profile Not Found</h2>
        <p>Unable to load your profile information. Please try logging in again.</p>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>
      
      <div className="profile-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          Order History
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''} 
          onClick={() => setActiveTab('reports')}
        >
          Monthly Reports
        </button>
      </div>
      
      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-info-container">
            {!editMode ? (
              <div className="profile-info">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    {profileData.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="profile-details">
                  <h2>{profileData.name}</h2>
                  <p><strong>Email:</strong> {profileData.email}</p>
                  {profileData.parentEmail && (
                    <p><strong>Parent Email:</strong> {profileData.parentEmail}</p>
                  )}
                  {profileData.phone && (
                    <p><strong>Phone:</strong> {profileData.phone}</p>
                  )}
                  <p><strong>Account Created:</strong> {moment(profileData.createdAt).format('DD MMMM YYYY')}</p>
                  
                  <button 
                    className="edit-profile-btn"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="edit-profile-form">
                <h2>Edit Profile</h2>
                
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                  />
                  <small>Email cannot be changed</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="parentEmail">Parent Email</label>
                  <input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-buttons">
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        name: profileData.name,
                        email: profileData.email,
                        parentEmail: profileData.parentEmail || '',
                        phone: profileData.phone || '',
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="orders-container">
            <h2>Order History</h2>
            
            {orders.length === 0 ? (
              <div className="no-orders">
                <p>You haven't placed any orders yet.</p>
                <Link to="/" className="start-ordering-btn">Start Ordering</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div className="order-card" key={order._id}>
                    <div className="order-header">
                      <div className="order-id">
                        <span>Order ID:</span> {order._id}
                      </div>
                      <div className={`order-status status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.status}
                      </div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-date">
                        <span>Date:</span> {moment(order.createdAt).format('DD MMM YYYY, h:mm A')}
                      </div>
                      <div className="order-total">
                        <span>Total:</span> ₹{parseFloat(order.amount).toFixed(2)}
                      </div>
                      <div className="order-payment">
                        <span>Payment:</span> {order.paymentMethod}
                        {order.payment ? ' (Paid)' : ' (Pending)'}
                      </div>
                    </div>
                    
                    <div className="order-items">
                      <h4>Items:</h4>
                      <ul>
                        {Object.entries(order.items).map(([itemId, item]) => (
                          <li key={itemId}>
                            {item.name} x {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link to={`/order/${order._id}`} className="view-order-btn">
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="reports-container">
            <h2>Monthly Expense Reports</h2>
            
            <div className="report-generator">
              <p>Generate and receive a monthly expense report via email. This report will include all your completed orders, total spending, and savings for the selected month.</p>
              
              <div className="report-form">
                <div className="form-group">
                  <label htmlFor="month-select">Select Month:</label>
                  <select 
                    id="month-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  className="generate-report-btn"
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                >
                  {reportLoading ? 'Generating...' : 'Generate & Email Report'}
                </button>
              </div>
              
              <div className="report-info">
                <p><strong>Note:</strong> Reports are sent to your registered email address{profileData.parentEmail ? ' and your parent\'s email address' : ''}.</p>
                <p>Reports are automatically generated and sent at the beginning of each month for the previous month's activity.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;