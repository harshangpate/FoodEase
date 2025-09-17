// Helper function to format image URLs from the backend
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Minimal logging in production
  const isProduction = import.meta.env.MODE === 'production';
  if (!isProduction) {
    console.log('Admin - Processing image path:', imagePath);
  }
  
  try {
    // Get the API base URL from environment variables with explicit production fallback
    const baseUrl = isProduction 
      ? (import.meta.env.VITE_API_URL || 'https://foodease-backend-zanj.onrender.com')
      : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    // Clean the base URL to ensure it doesn't have trailing spaces or comments
    const cleanBaseUrl = baseUrl.trim().split(' ')[0];
    
    if (!isProduction) {
      console.log('Admin - Using base URL:', cleanBaseUrl);
    }
    
    // If the image path already contains the full URL, return it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If imagePath already includes '/images/', format correctly
    if (imagePath.includes('/images/')) {
      // Ensure there's a slash between baseUrl and imagePath
      const fullUrl = `${cleanBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      if (!isProduction) console.log('Admin - Image URL with /images/:', fullUrl);
      return fullUrl;
    }
    
    // Handle case when image is just a filename (most common from backend)
    if (!imagePath.includes('/')) {
      const fullUrl = `${cleanBaseUrl}/images/${imagePath}`;
      if (!isProduction) console.log('Admin - Image URL from filename:', fullUrl);
      return fullUrl;
    }
    
    // Extract just the filename if it's a full path
    const filename = imagePath.split('/').pop();
    
    // Format the URL to the backend images endpoint
    const fullUrl = `${cleanBaseUrl}/images/${filename}`;
    if (!isProduction) console.log('Admin - Final image URL:', fullUrl);
    return fullUrl;
  } catch (err) {
    console.error('Admin - Error formatting image URL:', err);
    // Return a fallback URL that at least won't break the UI
    return `${import.meta.env.VITE_API_URL}/images/placeholder.jpg`;
  }
};