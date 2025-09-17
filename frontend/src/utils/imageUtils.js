// Helper function to format image URLs from the backend
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Minimal logging in production
  const isProduction = import.meta.env.MODE === 'production';
  if (!isProduction) {
    console.log('Processing image path:', imagePath);
  }
  
  try {
    // Get the API base URL from environment variables
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    // Make sure URL doesn't end with a slash to prevent double slashes
    const apiUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Debug the image path
    console.log('Image path:', imagePath);
    console.log('API URL:', apiUrl);
    
    // If the image path already contains the full URL, return it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If imagePath already includes '/images/', format correctly
    if (imagePath.includes('/images/')) {
      // Ensure there's a slash between baseUrl and imagePath
      const fullUrl = `${apiUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      if (!isProduction) console.log('Image URL with /images/:', fullUrl);
      return fullUrl;
    }
    
    // Handle case when image is just a filename (most common from backend)
    if (!imagePath.includes('/')) {
      const fullUrl = `${apiUrl}/images/${imagePath}`;
      if (!isProduction) console.log('Image URL from filename:', fullUrl);
      return fullUrl;
    }
    
    // Extract just the filename if it's a full path
    const filename = imagePath.split('/').pop();
    
    // Format the URL to the backend images endpoint
    const fullUrl = `${apiUrl}/images/${filename}`;
    if (!isProduction) console.log('Final image URL:', fullUrl);
    return fullUrl;
  } catch (err) {
    console.error('Error formatting image URL:', err);
    // Return a fallback URL that at least won't break the UI
    return `${apiUrl}/images/placeholder.jpg`;
  }
};