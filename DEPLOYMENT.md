# FoodEase Deployment Guide

This repository contains three components:
1. Backend API (Node.js/Express)
2. Frontend (React/Vite)
3. Admin Panel (React/Vite)

## Deployment Architecture

- **Backend**: Deployed on Railway.app (free tier)
- **Frontend**: Deployed on Netlify (free tier)
- **Admin Panel**: Deployed on Netlify (free tier, separate site)

## Environment Variables

After deployment, you'll need to update these environment variables:

### Backend (Railway)
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: 3000
- `NODE_ENV`: production

### Frontend (Netlify)
- `VITE_API_URL`: Your Railway backend URL (e.g., https://foodease-backend-production.up.railway.app)

### Admin Panel (Netlify)
- `VITE_API_URL`: Your Railway backend URL (e.g., https://foodease-backend-production.up.railway.app)

## CORS Configuration

The backend is already configured to accept requests from Netlify domains. If you use custom domains, you'll need to update the CORS configuration in `server.js`.

## Deployment Instructions

### Backend Deployment (Railway)

1. **Create a Railway account** at [railway.app](https://railway.app)
   - Sign up using GitHub (recommended) or email
   - No credit card required for the free tier

2. **Create a new project**:
   - Click "New Project" on your dashboard
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account if prompted
   - Select your FoodEase repository
   - Choose the "backend" directory as your project root
   - Select "Node" as the template

3. **Configure environment variables**:
   - Click on the "Variables" tab
   - Add the following variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: A strong secret key for JWT tokens
     - `PORT`: 3000
     - `NODE_ENV`: production

4. **Configure build settings**:
   - Go to the "Settings" tab
   - Set Root Directory to `/backend`
   - Set Build Command to `npm install`
   - Set Start Command to `npm start`

5. **View your deployed application**:
   - Go to the "Settings" tab
   - Look for "Domains" section to find your URL
   - Your backend will be available at a URL like: `https://foodease-backend-production.up.railway.app`
   - Test it by adding `/health` to the URL

6. **Copy your backend URL**:
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
- Check the Railway deployment logs for error messages
- Verify that MongoDB Atlas is properly configured to accept connections from anywhere
- Make sure your environment variables are set correctly

### Frontend/Admin Issues
- Check browser console for errors
- Verify that environment variables are set correctly
- Ensure CORS is properly configured on the backend

## Limitations of Free Tier Hosting

1. **Railway Free Tier Limitations**:
   - Limited compute hours per month
   - Projects may sleep after inactivity
   - Limited storage (files uploaded to the server may be lost when unused)

2. **Netlify Free Tier Limitations**:
   - Limited build minutes per month
   - Limited bandwidth

For a production environment, consider upgrading to paid plans or using more robust hosting solutions.