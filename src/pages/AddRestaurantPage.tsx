import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import RestaurantForm from '../components/RestaurantForm';
import { ArrowLeft } from 'lucide-react';
import { testSupabaseConnection, checkRLSStatus } from '../lib/debug-supabase';
import { checkDatabaseStructure } from '../lib/check-database';

const AddRestaurantPage: React.FC = () => {
  const navigate = useNavigate();
  const { addRestaurant } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [dbStructure, setDbStructure] = useState<any>(null);

  useEffect(() => {
    // Run debug tests when component mounts
    const runDebugTests = async () => {
      const connectionTest = await testSupabaseConnection();
      const rlsTest = await checkRLSStatus();
      const dbStructureTest = await checkDatabaseStructure();
      
      setDebugInfo({ connectionTest, rlsTest });
      setDbStructure(dbStructureTest);
      
      console.log('Debug tests completed:', { 
        connectionTest, 
        rlsTest,
        dbStructureTest
      });
    };
    
    runDebugTests();
  }, []);

  const handleAddRestaurant = async (data: any) => {
    setIsSubmitting(true);
    try {
      const id = await addRestaurant(data);
      if (id) {
        navigate(`/restaurant/${id}`);
      }
    } catch (error) {
      console.error('Error adding restaurant:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-6"
    >
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Vissza"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Új étterem hozzáadása</h1>
      </div>
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <RestaurantForm onSubmit={handleAddRestaurant} />
        
        {isSubmitting && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        )}
        
        {/* Debug information */}
        {debugInfo && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Database structure information */}
        {dbStructure && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Database Structure</h2>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(dbStructure, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AddRestaurantPage;
