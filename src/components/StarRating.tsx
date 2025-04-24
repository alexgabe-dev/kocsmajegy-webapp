import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  size = 24,
  readOnly = false,
}) => {
  const [hover, setHover] = React.useState(0);

  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index);
    }
  };

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          onMouseEnter={() => !readOnly && setHover(index)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`transition-transform duration-200 ${
            !readOnly ? 'hover:scale-110' : ''
          } ${!readOnly ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={`Rate ${index} stars`}
          disabled={readOnly}
        >
          <Star
            size={size}
            className={`transition-colors duration-200 ${
              index <= (hover || rating)
                ? 'fill-primary-400 text-primary-400'
                : 'fill-none text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;