import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface DishInputProps {
  dishes: string[];
  onChange: (dishes: string[]) => void;
}

const DishInput: React.FC<DishInputProps> = ({ dishes, onChange }) => {
  const [newDish, setNewDish] = useState('');

  const handleAddDish = () => {
    if (newDish.trim()) {
      onChange([...dishes, newDish.trim()]);
      setNewDish('');
    }
  };

  const handleRemoveDish = (index: number) => {
    const updatedDishes = [...dishes];
    updatedDishes.splice(index, 1);
    onChange(updatedDishes);
  };

  return (
    <div className="space-y-3 w-full max-w-full sm:max-w-lg mx-auto">
      <div className="flex">
        <input
          type="text"
          value={newDish}
          onChange={(e) => setNewDish(e.target.value)}
          placeholder="Add a dish (e.g. Goulash)"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddDish();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAddDish}
          className="px-3 py-2 bg-amber-500 text-white rounded-r-lg hover:bg-amber-600 transition-colors duration-200 font-medium text-base shadow-sm button-effect"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {dishes.map((dish, index) => (
          <div
            key={index}
            className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full group shadow-sm"
          >
            <span className="mr-2 text-gray-800 dark:text-gray-100 text-base">{dish}</span>
            <button
              type="button"
              onClick={() => handleRemoveDish(index)}
              className="text-gray-500 hover:text-red-500 transition-colors duration-200 ml-1"
              aria-label={`Remove ${dish}`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DishInput;