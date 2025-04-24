import React from 'react';
import { PriceTier as PriceTierType } from '../types';

interface PriceTierProps {
  tier: PriceTierType;
  onChange?: (tier: PriceTierType) => void;
  readOnly?: boolean;
}

const PriceTier: React.FC<PriceTierProps> = ({
  tier,
  onChange,
  readOnly = false,
}) => {
  const handleClick = (newTier: PriceTierType) => {
    if (!readOnly && onChange) {
      onChange(newTier);
    }
  };

  return (
    <div className="flex space-x-2 w-full max-w-xs mx-auto">
      {[1, 2, 3].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value as PriceTierType)}
          disabled={readOnly}
          className={`px-3 py-1 rounded-full transition-all duration-200 text-base font-semibold shadow-sm button-effect ${
            tier >= value
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          } ${!readOnly ? 'hover:bg-primary-400' : ''}`}
          aria-label={`Set price tier to ${value}`}
        >
          {'$'.repeat(value)}
        </button>
      ))}
    </div>
  );
};

export default PriceTier;