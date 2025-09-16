// Helper function to format image URLs from the backend
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // For debugging
  console.log('Admin - Processing image path:', imagePath);
  
  try {
    // Get base URL and ensure it doesn't have trailing comments or spaces
    const baseUrl = import.meta.env.VITE_API_URL.split('//')[0] === 'http:' 
      ? import.meta.env.VITE_API_URL.split('//')[0] + '//' + import.meta.env.VITE_API_URL.split('//')[1].trim().split(' ')[0]
      : import.meta.env.VITE_API_URL.trim().split(' ')[0];
    
    console.log('Admin - Using base URL:', baseUrl);
    
    // If the image path already contains the full URL, return it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If imagePath already includes '/images/', format correctly
    if (imagePath.includes('/images/')) {
      // Ensure there's a slash between baseUrl and imagePath
      const fullUrl = `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      console.log('Admin - Image URL with /images/:', fullUrl);
      return fullUrl;
    }
    
    // Handle case when image is just a filename (most common from backend)
    if (!imagePath.includes('/')) {
      const fullUrl = `${baseUrl}/images/${imagePath}`;
      console.log('Admin - Image URL from filename:', fullUrl);
      return fullUrl;
    }
    
    // Extract just the filename if it's a full path
    const filename = imagePath.split('/').pop();
    
    // Format the URL to the backend images endpoint
    const fullUrl = `${baseUrl}/images/${filename}`;
    console.log('Admin - Final image URL:', fullUrl);
    return fullUrl;
  } catch (err) {
    console.error('Admin - Error formatting image URL:', err);
    // Return a fallback URL that at least won't break the UI
    return `${import.meta.env.VITE_API_URL}/images/placeholder.jpg`;
  }
};