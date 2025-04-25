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

  // Common button style from HomePage/AuthPage
  const buttonClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400";

  if (loading) {
    return (
      // Loading spinner on black background
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    // Apply black background and light text color globally
    <div className="min-h-screen w-full bg-black text-zinc-200 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header - Dark theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          // Use dark background, remove gradient header
          className="bg-zinc-800 rounded-2xl shadow-xl overflow-hidden mb-8"
        >
          {/* Placeholder for potential banner image space, or just remove */}
          <div className="relative h-16 bg-zinc-700">
            <div className="absolute -bottom-16 left-6">
              {user && (
                <ProfileImageUpload
                  userId={user.id}
                  onImageChange={() => {}}
                  // Add theme specific styling if needed within ProfileImageUpload
                />
              )}
            </div>
          </div>

          <div className="pt-20 pb-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user?.user_metadata?.username || 'Felhasználó'}
                </h1>
                <div className="flex items-center gap-2 text-zinc-400 mt-1">
                  <Mail size={16} />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 mt-1">
                  <Calendar size={16} />
                  <span>Csatlakozott: {new Date(user?.created_at || '').toLocaleDateString('hu-HU')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Settings Section - Dark theme */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            // Dark background for the card
            className="bg-zinc-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <button
              onClick={() => toggleSection('profile')}
              // Darker button background, lighter hover
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Orange icon */}
                <Edit3 size={20} className="text-orange-500" />
                <span className="font-medium text-white">Profil beállítások</span>
              </div>
              <motion.div
                animate={{ rotate: activeSection === 'profile' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Adjusted chevron color */}
                <ChevronDown size={20} className="text-zinc-400" />
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
                  {/* Darker border */}
                  <div className="p-4 border-t border-zinc-700">
                    {/* ProfileSettings component might need internal styling updates */}
                    <ProfileSettings user={user!} onProfileUpdate={handleUpdateProfile} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password Change Section - Dark theme */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            // Dark background for the card
            className="bg-zinc-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <button
              onClick={() => toggleSection('password')}
              // Darker button background, lighter hover
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Orange icon */}
                <Settings size={20} className="text-orange-500" />
                <span className="font-medium text-white">Jelszó módosítása</span>
              </div>
              <motion.div
                animate={{ rotate: activeSection === 'password' ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Adjusted chevron color */}
                <ChevronDown size={20} className="text-zinc-400" />
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
                  {/* Darker border */}
                  <div className="p-4 border-t border-zinc-700">
                    {/* PasswordChange component might need internal styling updates */}
                    <PasswordChange onPasswordUpdate={handleUpdatePassword} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Logout Button at the bottom */}
        <div className="mt-12">
          <button
            onClick={handleLogout}
            className={`${buttonClasses} w-full flex items-center justify-center gap-2`} // Full width, centered content
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