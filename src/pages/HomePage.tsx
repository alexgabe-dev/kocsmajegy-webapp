import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import RestaurantCard from '../components/RestaurantCard';
import Modal from '../components/Modal';
import RestaurantForm from '../components/RestaurantForm';
import { Button } from '@/components/ui/button'; // Assuming Button component exists
import { Plus, Heart, Beer } from 'lucide-react'; // Import necessary icons

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {restaurants, addRestaurant, toggleFavorite, isFavorite, getRestaurantReviews } = useApp(); // Added user for potential future use
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Add state for filtering if needed
  // const [filterOpen, setFilterOpen] = useState(false);

  const handleViewRestaurant = (id: string) => {
    navigate(`/restaurant/${id}`);
  };

  const handleAddRestaurant = (data: any) => {
    const id = addRestaurant(data);
    setIsModalOpen(false);
    navigate(`/restaurant/${id}`); // Navigate after adding is fine, or maybe just close modal
  };

  const handleToggleFavorite = async (e: React.MouseEvent, restaurantId: string) => {
    e.stopPropagation();
    await toggleFavorite(restaurantId);
  };

  // Common button style based on AuthPage
  const buttonClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400";

  return (
    // Use the new dark background defined in index.css
    <div className="min-h-screen w-full bg-black text-zinc-200">
      {/* New Header Section based on image */}
      <header className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* KocsmaJegy Logo */}
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-orange-800">
              <Beer className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold uppercase tracking-wider text-white">
              Kocsma<span className="text-orange-500">Jegy</span>
            </span>
          </div>
        </div>
        {/* Add New Button */}
        <Button onClick={() => setIsModalOpen(true)} className={`${buttonClasses} px-6 w-full sm:w-auto`}>
          <Plus className="mr-2 h-5 w-5" />
          Új hely
        </Button>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8">
        {restaurants.length === 0 ? (
          // Empty state styled like AuthPage
          <div className="flex flex-col items-center justify-center space-y-6 rounded-lg bg-zinc-900/50 p-8 py-20 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-orange-800">
              <Beer className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Nincsenek még helyek
            </h2>
            <p className="max-w-md text-zinc-400">
              Kezdd az első kocsmaélményed hozzáadásával.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className={`${buttonClasses} px-8 py-3 text-base w-full sm:w-auto`} // Adjusted size/padding
            >
              <Plus className="mr-2 h-4 w-4" /> {/* Add icon consistency */}
              Hely hozzáadása
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="relative">
                {/* Favorite Button Styling */}
                <button
                  onClick={(e) => handleToggleFavorite(e, restaurant.id)}
                  className={`absolute top-3 right-3 z-10 rounded-full p-1.5 shadow-md transition-colors bg-black/50 backdrop-blur-sm hover:bg-black/70`}
                  aria-label={isFavorite(restaurant.id) ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"}
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite(restaurant.id) ? 'text-red-500 fill-current' : 'text-zinc-400'}`}
                  />
                </button>
                <RestaurantCard
                  restaurant={restaurant}
                  reviews={getRestaurantReviews(restaurant.id)}
                  onClick={() => handleViewRestaurant(restaurant.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Új hely hozzáadása"
      >
        <RestaurantForm onSubmit={handleAddRestaurant} />
      </Modal>
    </div>
  );
};

export default HomePage;