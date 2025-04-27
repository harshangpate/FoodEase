# FoodEase - Canteen Management System

## Overview

FoodEase is a comprehensive canteen management system designed specifically for ITM (SLS) Baroda University. The platform streamlines the food ordering process by allowing students to browse menus, place orders in advance, and make payments through a convenient QR-based system. By eliminating long queues and providing real-time order tracking, FoodEase enhances the campus dining experience while helping canteen staff manage orders more efficiently.

## 🍽️ Features

### For Students

- User Authentication : Secure login and registration system

- Menu Browsing : Browse food items by canteen with search and filter options

- Cart Management : Add/remove items, adjust quantities, and apply promocodes

- Payment Options : QR-based UPI payment system with full and partial payment options

- Order Tracking : Real-time status updates from order placement to food collection

- Order History : View past orders and their details

### For Administrators

- Order Management : Process incoming orders and update their status

- Payment Verification : Verify payments using UPI reference IDs

- Menu Management : Add, update, or remove food items

- Promocode System : Create and manage discount codes

## 🛠️ Technology Stack

### Frontend

- React.js - For building the user interface

- CSS3/SCSS - For styling components

- Redux - For state management

- Axios - For API requests

- QRCode.react - For generating payment QR codes

### Backend

- Node.js - Runtime environment

- Express.js - Web application framework

- MongoDB - NoSQL database

- Mongoose - MongoDB object modeling

- JWT - For secure authentication

## 📋 Installation

### Prerequisites

- Node.js (v14 or higher)

- MongoDB

- npm or yarn

### Setup Instructions

1\. Clone the repository
```
git clone https://github.com/yourusername/FoodEase.git
cd FoodEase
```

2\. Install dependencies for backend
```
cd backend
npm install
```

3\. Configure environment variables Create a .env file in the backend directory with the following variables:
```
JWT_SECRET=your-secret-key
MERCHANT_UPI_ID=your-upi-id
MERCHANT_NAME=FoodEase
```
4\. Install dependencies for frontend
```
cd ../frontend
npm install
```
5\. Start the backend server
```
cd ../backend
npm start
```
6\. Start the frontend development server
```
cd ../frontend
npm start
```
7\. Access the application

- Frontend: http://localhost:3000

- Backend API: http://localhost:5000

## 🚀 Usage

### Student Flow

1\. Register/Login to the system

2\. Browse available food items from different canteens

3\. Add desired items to cart

4\. Apply promocode (if available)

5\. Proceed to checkout

6\. Choose payment option (full or partial payment)

7\. Scan QR code with UPI app and complete payment

8\. Enter UPI reference ID for verification

9\. Track order status

10\. Collect food when ready

### Admin Flow

1\. Login to admin dashboard

2\. View incoming orders

3\. Update order status

4\. Verify payments using reference IDs

5\. Manage menu items and promocodes

## 📁 Project Structure

```bash
FoodEase/
├── backend/               # Backend server code
│   ├── controllers/       # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   └── server.js          # Entry point
├── frontend/              # React frontend
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── Context/       # Context providers
│       └── assets/        # Images and other assets
├── admin/                 # Admin dashboard
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # Admin components
│       ├── pages/         # Admin pages
└── README.md              # Project documentation
```
## 🔮 Future Enhancements

- Mobile application development

- Integration with university ID system

- Advanced analytics for canteen management

- Loyalty program implementation

- Scheduled ordering for regular meals

## 👥 Contributors

- Harshang Patel
- Shivansh Patel
- Siddharaj Parmar

## 📄 License

This project is licensed under the MIT License

## 🙏 Acknowledgments
- Faculty Advisors for their guidance and technical expertise throughout the development process
- Beta Testers who provided valuable feedback during the testing phase
- All contributors who have helped in the development process
- The open-source community for the various libraries and frameworks that made this project possible
- React.js, Node.js, and MongoDB communities for their excellent documentation and support forums
- Stack Overflow contributors whose solutions helped overcome numerous technical challenges
