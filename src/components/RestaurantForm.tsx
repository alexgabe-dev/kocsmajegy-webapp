import React, { useState } from 'react';
import { Restaurant, PriceTier } from '../types';
import PriceTierComponent from './PriceTier';

interface RestaurantFormProps {
  initialData?: Partial<Restaurant>;
  onSubmit: (data: Omit<Restaurant, 'id' | 'createdAt'>) => void;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  initialData = {},
  onSubmit,
}) => {
  const [name, setName] = useState(initialData.name || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [priceTier, setPriceTier] = useState<PriceTier>(initialData.priceTier || 1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Restaurant name is required';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        name,
        address,
        priceTier,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Restaurant Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter restaurant name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter restaurant address"
        />
        {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <PriceTierComponent
          tier={priceTier}
          onChange={setPriceTier}
        />
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Save Restaurant
        </button>
      </div>
    </form>
  );
};

export default RestaurantForm;