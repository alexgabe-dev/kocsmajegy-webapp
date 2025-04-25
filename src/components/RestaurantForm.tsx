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
  const [description, setDescription] = useState(initialData.description || '');
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
        description,
        priceTier,
      });
    }
  };

  const buttonClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 w-full";

  const inputClasses = (hasError: boolean): string =>
    `w-full px-3 py-2 rounded-lg bg-zinc-700 border text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${ 
      hasError ? 'border-red-500' : 'border-zinc-600'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
          Hely neve
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClasses(!!errors.name)}
          placeholder="Pl. Arany Oroszlán"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-zinc-300 mb-1">
          Cím
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClasses(!!errors.address)}
          placeholder="Pl. Budapest, Fő utca 1."
        />
        {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">
          Leírás (opcionális)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClasses(false)} min-h-[80px]`}
          placeholder="Rövid leírás, hangulat, jellemzők..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Árkategória
        </label>
        <PriceTierComponent
          tier={priceTier}
          onChange={setPriceTier}
        />
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          className={buttonClasses}
        >
          Hely mentése
        </button>
      </div>
    </form>
  );
};

export default RestaurantForm;