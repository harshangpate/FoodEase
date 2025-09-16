import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const userManagementRouter = express.Router();

// Protect all these routes with admin middleware
userManagementRouter.use(authenticateAdmin);

// Get all users or filter by query
userManagementRouter.get('/users', getUsers);

// Get specific user by ID
userManagementRouter.get('/users/:id', getUserById);

// Update user
userManagementRouter.put('/users/:id', updateUser);

// Delete user
userManagementRouter.delete('/users/:id', deleteUser);

export default userManagementRouter;