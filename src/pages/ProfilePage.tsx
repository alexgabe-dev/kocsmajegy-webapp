import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import ProfileImageUpload from '../components/ProfileImageUpload';
import { useToast } from '../context/ToastContext';
import { Settings, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import PasswordChange from '../components/PasswordChange';
import ProfileSettings from '../components/ProfileSettings';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      showToast('Sikeres kijelentkezés!', 'success');
    } catch (error) {
      console.error('Error logging out:', error);
      showToast('Hiba történt a kijelentkezés során!', 'error');
    }
  };

  const handleUpdateProfile = async (data: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: data.username,
        },
      });

      if (error) throw error;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      fetchUserData();
      showToast('Profil sikeresen frissítve!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Hiba történt a profil frissítése során!', 'error');
    }
  };

  const handleUpdatePassword = async (data: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      showToast('Jelszó sikeresen frissítve!', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      showToast('Hiba történt a jelszó frissítése során!', 'error');
    }
  };

  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-black pb-16 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-black rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user && (
                <ProfileImageUpload 
                  userId={user.id}
                  onImageChange={() => {/* Nem használjuk, de szükséges prop */}}
                />
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.user_metadata?.username || 'Felhasználó'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Csatlakozott: {new Date(user?.created_at || '').toLocaleDateString('hu-HU')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Profile Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button 
              onClick={() => toggleSection('profile')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Settings size={20} className="text-amber-500" />
                <span className="text-foreground font-medium">Profil beállítások</span>
              </div>
              {activeSection === 'profile' ? (
                <ChevronUp size={20} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={20} className="text-muted-foreground" />
              )}
            </button>
            
            {activeSection === 'profile' && (
              <div className="p-4">
                <ProfileSettings user={user!} onProfileUpdate={handleUpdateProfile} />
              </div>
            )}
          </div>
          
          {/* Password Change */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button 
              onClick={() => toggleSection('password')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Settings size={20} className="text-amber-500" />
                <span className="text-foreground font-medium">Jelszó módosítása</span>
              </div>
              {activeSection === 'password' ? (
                <ChevronUp size={20} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={20} className="text-muted-foreground" />
              )}
            </button>
            
            {activeSection === 'password' && (
              <div className="p-4">
                <PasswordChange onUpdatePassword={handleUpdatePassword} />
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Kijelentkezés</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
