import React, { useState, useEffect } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileImageUploadProps {
  userId: string;
  onImageChange: (imageData: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ userId, onImageChange }) => {
  const [uploading, setUploading] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Fetch existing profile image on component mount
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        // Először próbáljuk meg a get_profile_image funkciót használni
        const { data: functionData, error: functionError } = await supabase.rpc(
          'get_profile_image',
          { user_uuid: userId }
        );
        
        if (functionError) {
          console.error('Error fetching profile image with function:', functionError);
          
          // Ha a funkció nem működik, próbáljuk meg közvetlenül lekérdezni
          const { data, error } = await supabase
            .from('profile_images')
            .select('image_data')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
            
          if (error) {
            console.error('Error fetching profile image:', error);
            return;
          }
          
          if (data?.image_data) {
            setProfileImage(data.image_data);
            onImageChange(data.image_data);
          }
        } else if (functionData) {
          setProfileImage(functionData);
          onImageChange(functionData);
        }
      } catch (error) {
        console.error('Error in fetchProfileImage:', error);
      }
    };
    
    if (userId) {
      fetchProfileImage();
    }
  }, [userId, onImageChange]);

  const uploadProfileImage = async (file: File) => {
    try {
      setUploading(true);
      
      // Konvertáljuk a képet base64 formátumba
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Image = e.target.result as string;
          
          // Mentsük el a képet a profile_images táblában
          const { error } = await supabase
            .from('profile_images')
            .insert({
              user_id: userId,
              image_data: base64Image,
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            console.error('Error saving profile image:', error);
            alert('Hiba történt a profilkép mentésekor');
            return;
          }
          
          // Frissítsük a képet a UI-n
          setProfileImage(base64Image);
          onImageChange(base64Image);
          setShowUploadArea(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Hiba történt a profilkép feltöltésekor');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Ellenőrizzük a fájl méretét (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        alert('A fájl mérete nem lehet nagyobb, mint 1MB');
        return;
      }
      
      uploadProfileImage(file);
    }
  };

  return (
    <div className="relative">
      {/* Avatar display */}
      <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-700 overflow-hidden shadow-lg">
        {profileImage ? (
          <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Camera size={40} className="text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Upload button */}
      <button 
        className="absolute bottom-0 right-0 bg-amber-500 text-white p-1.5 rounded-full shadow-md hover:bg-amber-600 transition-colors"
        onClick={() => setShowUploadArea(!showUploadArea)}
        disabled={uploading}
        aria-label="Profilkép módosítása"
      >
        {uploading ? (
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera size={16} />
        )}
      </button>
      
      {/* Upload area (shown when button is clicked) */}
      {showUploadArea && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-10 border border-gray-200 dark:border-gray-700">
          <button 
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setShowUploadArea(false)}
          >
            <X size={16} />
          </button>
          
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Válassz új profilképet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Maximum méret: 1MB
            </p>
            
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            
            <label
              htmlFor="profile-image-upload"
              className={`block w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg cursor-pointer transition-colors ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? 'Feltöltés...' : 'Tallózás'}
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
