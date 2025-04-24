import React, { useState } from 'react';
import { X, Plus, DollarSign } from 'lucide-react';
import { DishPrice } from '../types';

interface DishPriceInputProps {
  dishPrices: DishPrice[];
  onChange: (dishPrices: DishPrice[]) => void;
}

const DishPriceInput: React.FC<DishPriceInputProps> = ({ dishPrices, onChange }) => {
  const [newDish, setNewDish] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  const handleAddDish = () => {
    if (newDish.trim()) {
      // Validate price
      const price = parseFloat(newPrice);
      if (isNaN(price) || price <= 0) {
        setError('Kérjük, adj meg egy érvényes árat');
        return;
      }

      onChange([...dishPrices, { dish: newDish.trim(), price }]);
      setNewDish('');
      setNewPrice('');
      setError('');
    } else {
      setError('Kérjük, add meg az étel nevét');
    }
  };

  const handleRemoveDish = (index: number) => {
    const updatedDishes = [...dishPrices];
    updatedDishes.splice(index, 1);
    onChange(updatedDishes);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-1">
          <input
            type="text"
            value={newDish}
            onChange={(e) => setNewDish(e.target.value)}
            placeholder="Étel neve (pl. Gulyásleves)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-black text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newDish.trim() && newPrice.trim()) {
                e.preventDefault();
                handleAddDish();
              }
            }}
          />
        </div>
        
        <div className="flex">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={16} className="text-gray-400" />
            </div>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Ár"
              min="0"
              step="100"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-lg sm:rounded-none focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-black text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newDish.trim() && newPrice.trim()) {
                  e.preventDefault();
                  handleAddDish();
                }
              }}
            />
          </div>
          
          <button
            type="button"
            onClick={handleAddDish}
            className="px-3 py-2 bg-amber-500 text-white rounded-r-lg hover:bg-amber-600 transition-colors duration-200 font-medium shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {dishPrices.map((item, index) => (
          <div
            key={index}
            className="flex items-center bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full group shadow-sm"
          >
            <span className="mr-1 text-amber-800 dark:text-amber-200 font-medium">{item.dish}</span>
            <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800/50 rounded text-amber-800 dark:text-amber-200 text-xs font-medium">
              {item.price.toLocaleString('hu-HU')} Ft
            </span>
            <button
              type="button"
              onClick={() => handleRemoveDish(index)}
              className="text-amber-500 hover:text-red-500 transition-colors duration-200 ml-1.5"
              aria-label={`Eltávolítás: ${item.dish}`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DishPriceInput;
