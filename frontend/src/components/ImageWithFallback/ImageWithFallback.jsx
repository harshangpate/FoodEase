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
      const url = getImageUrl(src);
      setImageUrl(url);
    } catch (err) {
      console.error('Error processing image URL:', err);
      setError(true);
    }
  }, [src]);
  
  // Use a food placeholder from assets or generate a nice color-based placeholder
  const generateFoodPlaceholder = (name) => {
    // If we have a placeholder in assets, use that
    if (assets.food_placeholder) {
      return assets.food_placeholder;
    }
    
    // Otherwise, generate a nice placeholder based on the food name
    const foodName = name || 'Food';
    const bgColors = ['orange', 'teal', 'steelblue', 'slateblue', 'tomato'];
    // Use the first character of the name to select a color (simple hash function)
    const colorIndex = foodName.charCodeAt(0) % bgColors.length;
    const bgColor = bgColors[colorIndex];
    
    // Log the image loading error for debugging
    console.error('Image loading error for:', name, '- Using placeholder');
    
    // Return a placeholder with the food name (just the first word for cleaner display)
    const displayName = foodName.split(' ')[0];
    return `https://placehold.co/400x300/${bgColor}/white?text=${encodeURIComponent(displayName)}`;
  };
  
  const fallbackImage = generateFoodPlaceholder(alt);

  return (
    <img
      src={error ? fallbackImage : imageUrl}
      alt={alt || 'Food item'}
      onError={(e) => {
        console.error('Image failed to load:', imageUrl);
        setError(true);
      }}
      className={className}
      {...props}
    />
  );
};

export default ImageWithFallback;