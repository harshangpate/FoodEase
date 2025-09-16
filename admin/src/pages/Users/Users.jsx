import React, { useState, useEffect } from 'react';
import './Users.css';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchName, setSearchName] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'delete'
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        parentEmail: '',
        password: ''
    });

    // Fetch users on component mount and when search/pagination changes
    useEffect(() => {
        fetchUsers();
    }, [currentPage]);

    const fetchUsers = async (nameFilter = searchName, emailFilter = searchEmail) => {
        setLoading(true);
        try {
            // Get token from localStorage
            const token = localStorage.getItem('adminToken');
            
            if (!token) {
                toast.error('Authentication required');
                setLoading(false);
                return;
            }
            
            // Build query parameters
            const params = new URLSearchParams();
            if (nameFilter) params.append('name', nameFilter);
            if (emailFilter) params.append('email', emailFilter);
            params.append('page', currentPage);
            params.append('limit', 10);
            
            const response = await api.get(`/api/user-management/users?${params.toString()}`, {
                headers: { token }
            });
            
            if (response.data.success) {
                setUsers(response.data.users);
                setTotalPages(response.data.pagination.pages);
            } else {
                toast.error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1); // Reset to first page when searching
        fetchUsers(searchName, searchEmail);
    };

    const clearSearch = () => {
        setSearchName('');
        setSearchEmail('');
        setCurrentPage(1);
        fetchUsers('', '');
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            parentEmail: user.parentEmail || '',
            password: '' // We don't display the current password
        });
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setModalMode('delete');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            parentEmail: '',
            password: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (modalMode === 'edit') {
            // Handle update user
            try {
                const token = localStorage.getItem('adminToken');
                
                // Only include fields that have values
                const updateData = {};
                if (formData.name) updateData.name = formData.name;
                if (formData.email) updateData.email = formData.email;
                // parentEmail can be empty string to remove it
                updateData.parentEmail = formData.parentEmail;
                if (formData.password) updateData.password = formData.password;
                
                const response = await api.put(
                    `/api/user-management/users/${selectedUser._id}`,
                    updateData,
                    { headers: { token } }
                );
                
                if (response.data.success) {
                    toast.success('User updated successfully');
                    fetchUsers(); // Refresh the list
                    closeModal();
                } else {
                    toast.error(response.data.message || 'Failed to update user');
                }
            } catch (error) {
                console.error('Error updating user:', error);
                toast.error(error.response?.data?.message || 'Failed to update user');
            }
        } else if (modalMode === 'delete') {
            // Handle delete user
            try {
                const token = localStorage.getItem('adminToken');
                
                const response = await api.delete(
                    `/api/user-management/users/${selectedUser._id}`,
                    { headers: { token } }
                );
                
                if (response.data.success) {
                    toast.success('User deleted successfully');
                    fetchUsers(); // Refresh the list
                    closeModal();
                } else {
                    toast.error(response.data.message || 'Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    // Render pagination buttons
    const renderPagination = () => {
        const buttons = [];
        
        for (let i = 1; i <= totalPages; i++) {
            buttons.push(
                <button 
                    key={i}
                    className={currentPage === i ? 'active' : ''}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }
        
        return (
            <div className="pagination">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    &laquo; Prev
                </button>
                
                {buttons}
                
                <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next &raquo;
                </button>
            </div>
        );
    };

    return (
        <div className="users-page">
            <div className="users-header">
                <h2>User Management</h2>
            </div>
            
            <div className="search-filter">
                <input 
                    type="text"
                    placeholder="Search by name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                />
                <input 
                    type="text"
                    placeholder="Search by email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
                <button onClick={clearSearch}>Clear</button>
            </div>
            
            {loading ? (
                <div className="loading">
                    <p>Loading users...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <p>No users found</p>
                </div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Parent Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.parentEmail || 'Not provided'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className="edit"
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="delete"
                                                    onClick={() => openDeleteModal(user)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {renderPagination()}
                </>
            )}
            
            {/* Modal for Edit/Delete */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {modalMode === 'edit' ? 'Edit User' : 'Delete User'}
                            </h3>
                            <button className="close-button" onClick={closeModal}>&times;</button>
                        </div>
                        
                        {modalMode === 'edit' ? (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input 
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Email</label>
                                    <input 
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Parent Email (Optional)</label>
                                    <input 
                                        type="email"
                                        name="parentEmail"
                                        value={formData.parentEmail}
                                        onChange={handleChange}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>New Password (Leave blank to keep current)</label>
                                    <input 
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        minLength={8}
                                    />
                                </div>
                                
                                <div className="form-buttons">
                                    <button type="button" className="cancel" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <p>Are you sure you want to delete this user?</p>
                                <p><strong>Name:</strong> {selectedUser?.name}</p>
                                <p><strong>Email:</strong> {selectedUser?.email}</p>
                                
                                <div className="form-buttons">
                                    <button className="cancel" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button className="delete" onClick={handleSubmit}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;