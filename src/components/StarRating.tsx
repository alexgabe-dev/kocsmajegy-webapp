import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  size = 20,
  readOnly = false,
  className = '',
  onClick,
}) => {
  const handleClick = (value: number) => {
    if (!readOnly && onChange) {
      onChange(value);
    }
    if (onClick) {
      onClick();
    }
  };

  // Biztosítjuk, hogy a rating szám legyen és 0-5 között legyen
  const normalizedRating = typeof rating === 'number' ? Math.max(0, Math.min(5, rating)) : 0;

  return (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          className={`focus:outline-none ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          disabled={readOnly}
        >
          <Star
            size={size}
            className={`${
              value <= normalizedRating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600 fill-none'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;