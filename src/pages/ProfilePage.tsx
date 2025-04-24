import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import ProfileImageUpload from '../components/ProfileImageUpload';
import { useToast } from '../context/ToastContext';
import { Settings, ChevronDown, ChevronUp, LogOut, Calendar, Mail, Edit3 } from 'lucide-react';
import PasswordChange from '../components/PasswordChange';
import ProfileSettings from '../components/ProfileSettings';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-black pb-16 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8"
        >
          <div className="relative h-32 bg-gradient-to-r from-amber-400 to-amber-600 dark:from-amber-600 dark:to-amber-800">
            <div className="absolute -bottom-16 left-6">
              {user && (
                <ProfileImageUpload 
                  userId={user.id}
                  onImageChange={() => {/* Nem használjuk, de szükséges prop */}}
                />
              )}
            </div>
          </div>
          
          <div className="pt-20 pb-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.user_metadata?.username || 'Felhasználó'}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                  <Mail size={16} />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 mt-1">
                  <Calendar size={16} />
                  <span>Csatlakozott: {new Date(user?.created_at || '').toLocaleDateString('hu-HU')}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md self-start md:self-center"
              >
                <LogOut size={18} />
                <span>Kijelentkezés</span>
              </button>
            </div>
          </div>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <button 
              onClick={() => toggleSection('profile')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Edit3 size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Profil beállítások</span>
              </div>
              <motion.div
                animate={{ rotate: activeSection === 'profile' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-gray-400" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <ProfileSettings user={user!} onProfileUpdate={handleUpdateProfile} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Password Change */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <button 
              onClick={() => toggleSection('password')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Settings size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Jelszó módosítása</span>
              </div>
              <motion.div
                animate={{ rotate: activeSection === 'password' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={20} className="text-gray-400" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {activeSection === 'password' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <PasswordChange onUpdatePassword={handleUpdatePassword} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
