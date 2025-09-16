import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import { assets } from '../../assets/assets';

const ImageWithFallback = ({ src, alt, className, ...props }) => {
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  useEffect(() => {
    // Reset error state when src changes
    setError(false);
    
    if (!src) {
      setError(true);
      return;
    }
    
    // Generate URL using the helper function
    try {
      // Use default food image rendering instead of trying to load potentially missing images
      // This is a simple, reliable solution for the admin panel
      setImageUrl(getImageUrl(src));
    } catch (err) {
      console.error('Error processing image URL:', err);
      setError(true);
    }
  }, [src]);
  
  // Use a simple colored placeholder for admin panel
  const generatePlaceholder = (name) => {
    // Extract first letter or use a default
    const firstLetter = (name && typeof name === 'string') ? name.charAt(0).toUpperCase() : 'F';
    
    // Generate a simple colored box with the first letter
    return `https://placehold.co/50x50/orange/white?text=${firstLetter}`;
  };

  // Get a placeholder based on the food name or use default
  const fallbackImage = generatePlaceholder(alt);

  return (
    <div className="food-image-container" style={{ overflow: 'hidden', borderRadius: '4px' }}>
      <img
        src={error ? fallbackImage : imageUrl}
        alt={alt || 'Food item'}
        className={className || ''}
        onError={() => setError(true)}
        style={{ objectFit: 'cover', height: '50px', width: '50px' }}
        {...props}
      />
    </div>
  );

  return (
    <img
      src={error ? fallbackImage : imageUrl}
      alt={alt || 'Food item'}
      className={className || ''}
      onError={handleError}
      style={{ objectFit: 'cover', height: '50px', width: '50px' }}
      {...props}
    />
  );
};

export default ImageWithFallback;