import React, { useState, useEffect, useRef } from 'react';
import { Camera, Loader2, Eye, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface ProfileImageUploadProps {
  userId: string;
  onImageChange: (imageData: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ userId, onImageChange }) => {
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // menuRef removed


  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        // Always use the fallback query for reliability
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
      
      const mimeType = file.type;
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Image = e.target.result as string;
          
          const { error } = await supabase
            .from('profile_images')
            .insert({
              user_id: userId,
              image_data: base64Image,
              mime_type: mimeType,
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            console.error('Error saving profile image:', error);
            alert('Hiba történt a profilkép mentésekor');
            return;
          }
          
          setProfileImage(base64Image);
          onImageChange(base64Image);
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
      
      if (file.size > 1 * 1024 * 1024) {
        alert('A fájl mérete nem lehet nagyobb, mint 1MB');
        return;
      }
      
      uploadProfileImage(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleViewClick = () => {
    console.log('View profile picture clicked');
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      <div
        onClick={() => !uploading && setIsMenuOpen(!isMenuOpen)}
        className={`
          relative h-32 w-32 rounded-full
          border-4 border-zinc-800 overflow-hidden shadow-lg
          ${!uploading ? 'cursor-pointer' : 'cursor-default opacity-70'}
        `}
      >
        {profileImage ? (
          <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-700">
            <Camera size={48} className="text-zinc-500" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 size={32} className="text-orange-500 animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isMenuOpen && !uploading && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-56 bg-zinc-800 rounded-lg shadow-xl z-20 border border-zinc-700 overflow-hidden"
            >
              <ul className="py-1 text-sm text-zinc-200">
                {profileImage && (
                  <li>
                    <button
                      onClick={handleViewClick}
                      className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-zinc-700 transition-colors"
                    >
                      <Eye size={16} className="text-orange-500" />
                      Profilkép megtekintése
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={handleUploadClick}
                    className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-zinc-700 transition-colors"
                  >
                    <UploadCloud size={16} className="text-orange-500" />
                    Új profilkép feltöltése
                  </button>
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <input
        type="file"
        id="profile-image-upload"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default ProfileImageUpload;
