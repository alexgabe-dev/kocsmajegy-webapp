import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Heart, User } from 'lucide-react'; // Use User icon for Profile
import { motion } from 'framer-motion';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Updated nav items based on the image
  const navItems = [
    { icon: Home, label: 'Főoldal', path: '/' },
    { icon: Search, label: 'Keresés', path: '/search' }, // Assuming a search path
    { icon: Plus, label: 'Add', path: '/add', isCentral: true }, // Central button flag
    { icon: Heart, label: 'Kedvencek', path: '/favorites' }, // Assuming a favorites path
    { icon: User, label: 'Profil', path: '/profile' }, // Profile tab instead of Admin
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800"
    >
      <div className="flex justify-around items-center h-16 bg-black/90 backdrop-blur-sm">
        {navItems.map(({ icon: Icon, label, path, isCentral }) => {
          if (isCentral) {
            return (
              <motion.button
                key={path}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(path)}
                className="bg-primary rounded-full p-3 -mt-4 shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Icon size={28} className="text-primary-foreground" />
              </motion.button>
            );
          }
          return (
            <motion.button
              key={path}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center space-y-1 p-2 ${
                location.pathname.startsWith(path)
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNav;