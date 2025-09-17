# FoodEase Deployment Guide

This repository contains three components:
1. Backend API (Node.js/Express)
2. Frontend (React/Vite)
3. Admin Panel (React/Vite)

## Deployment Architecture

- **Backend**: Deployed on Replit (free tier)
- **Frontend**: Deployed on Netlify (free tier)
- **Admin Panel**: Deployed on Netlify (free tier, separate site)

## Environment Variables

After deployment, you'll need to update these environment variables:

### Backend (Replit)
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: 3000 (Replit default)
- `NODE_ENV`: production

### Frontend (Netlify)
- `VITE_API_URL`: Your Replit backend URL (e.g., https://foodease-backend.yourusername.repl.co)

### Admin Panel (Netlify)
- `VITE_API_URL`: Your Replit backend URL (e.g., https://foodease-backend.yourusername.repl.co)

## CORS Configuration

The backend is already configured to accept requests from Netlify domains. If you use custom domains, you'll need to update the CORS configuration in `server.js`.

## Deployment Instructions

### Backend Deployment (Replit)

1. **Create a Replit account** at [replit.com](https://replit.com)

2. **Create a new Node.js project**:
   - Click on "Create Repl"
   - Select "Import from GitHub"
   - Paste your GitHub repository URL
   - Select "Node.js" as the language
   - Click "Import from GitHub"

3. **Configure environment variables**:
   - Click on "Secrets" (lock icon) in the left sidebar
   - Add the following secrets:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A strong secret key for JWT tokens
     - `NODE_ENV`: "production"

4. **Run the server**:
   - Click on "Run" at the top of the Replit interface
   - Your backend will be deployed and available at the URL shown

5. **Copy your backend URL**:
   - It will look like: https://foodease-backend.yourusername.repl.co
   - You'll need this URL for the frontend and admin panel deployments

### Frontend Deployment (Netlify)

1. **Create a Netlify account** at [netlify.com](https://netlify.com)

2. **Deploy the frontend**:
   - Click "Add new site" > "Import an existing project"
   - Connect to your GitHub repository
   - Configure build settings:
     - Base directory: `frontend`
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Configure environment variables**:
   - Go to Site settings > Build & deploy > Environment
   - Add environment variable:
     - Key: `VITE_API_URL`
     - Value: Your Replit backend URL (e.g., https://foodease-backend.yourusername.repl.co)
   - Click "Save"

4. **Trigger a new deploy**:
   - Go to the Deploys tab
   - Click "Trigger deploy" > "Deploy site"

### Admin Panel Deployment (Netlify)

1. **Create a new site** on Netlify (using the same account)

2. **Deploy the admin panel**:
   - Click "Add new site" > "Import an existing project"
   - Connect to the same GitHub repository
   - Configure build settings:
     - Base directory: `admin`
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Configure environment variables**:
   - Go to Site settings > Build & deploy > Environment
   - Add environment variable:
     - Key: `VITE_API_URL`
     - Value: Your Replit backend URL (e.g., https://foodease-backend.yourusername.repl.co)
   - Click "Save"

4. **Trigger a new deploy**:
   - Go to the Deploys tab
   - Click "Trigger deploy" > "Deploy site"

## Testing Your Deployment

1. **Test the backend**:
   - Visit your Replit URL + "/health" (e.g., https://foodease-backend.yourusername.repl.co/health)
   - You should see a JSON response with status "healthy"

2. **Test the frontend**:
   - Visit your Netlify frontend URL
   - Try to view food items, register, log in, and place an order

3. **Test the admin panel**:
   - Visit your Netlify admin panel URL
   - Log in with admin credentials
   - Check if you can manage food items and view orders

## Troubleshooting

### Backend Issues
- If your backend goes to sleep on Replit, it will wake up on the first request (may take a few seconds)
- Check the Replit console for error messages
- Verify that MongoDB Atlas is properly configured to accept connections from anywhere

### Frontend/Admin Issues
- Check browser console for errors
- Verify that environment variables are set correctly
- Ensure CORS is properly configured on the backend

## Limitations of Free Tier Hosting

1. **Replit Free Tier Limitations**:
   - Backend will go to sleep after inactivity
   - First request after sleep will be slow
   - Limited storage (files uploaded to the server may be lost)

2. **Netlify Free Tier Limitations**:
   - Limited build minutes per month
   - Limited bandwidth

For a production environment, consider upgrading to paid plans or using more robust hosting solutions.