import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
// import Header from '../components/Header'; // Remove if Header component is no longer used directly here
import RestaurantCard from '../components/RestaurantCard';
import Modal from '../components/Modal';
import RestaurantForm from '../components/RestaurantForm';
import { Button } from '@/components/ui/button'; // Assuming Button component exists
import { Filter, Plus, Heart } from 'lucide-react'; // Import necessary icons

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurants, addRestaurant, toggleFavorite, isFavorite, getRestaurantReviews } = useApp();
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

  return (
    // Use the new dark background defined in index.css
    <div className="min-h-screen bg-background text-foreground w-full">
      {/* New Header Section based on image */}
      <header className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <h1 className="text-3xl font-bold tracking-tight">Kocsmajegyeid</h1>
          <Button variant="outline" size="icon" className="border-muted-foreground/30">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 w-full sm:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Új hely
        </Button>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="bg-muted p-8 rounded-full">
              <span className="text-6xl">🍺</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Nincsenek még helyek
            </h2>
            <p className="text-muted-foreground max-w-md">
              Kezdd az első kocsmaélményed hozzáadásával.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg w-full sm:w-auto"
            >
              Hely hozzáadása
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="relative">
                <button
                  onClick={(e) => handleToggleFavorite(e, restaurant.id)}
                  className={`absolute top-3 right-3 z-10 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                  aria-label={isFavorite(restaurant.id) ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"}
                >
                  <Heart 
                    className={`h-5 w-5 ${isFavorite(restaurant.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
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