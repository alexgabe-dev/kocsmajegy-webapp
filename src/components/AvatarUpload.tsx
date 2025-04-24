import React, { useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AvatarUploadProps {
  userId: string;
  avatarUrl: string | null;
  onAvatarChange: (url: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, avatarUrl, onAvatarChange }) => {
  const [uploading, setUploading] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);
      
      // Használjunk base64 kódolást a kép tárolásához a Supabase Storage helyett
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Image = e.target.result as string;
          
          // Mentsük el a base64 képet a profiles táblában
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({ 
              id: userId, 
              avatar_url: base64Image,
              updated_at: new Date().toISOString()
            });
            
          if (updateError) {
            throw updateError;
          }
          
          // Frissítsük a UI-t
          onAvatarChange(base64Image);
          setShowUploadArea(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar!');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      uploadAvatar(file);
    }
  };

  return (
    <div className="relative">
      {/* Avatar display */}
      <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-700 overflow-hidden shadow-lg">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <Camera size={40} className="text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Upload button */}
      <button 
        className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md hover:bg-primary/90 transition-colors"
        onClick={() => setShowUploadArea(!showUploadArea)}
        disabled={uploading}
        aria-label="Change profile picture"
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
            
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            
            <label
              htmlFor="avatar-upload"
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

export default AvatarUpload;
