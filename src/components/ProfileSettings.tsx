import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Save, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileSettingsProps {
  user: User;
  onProfileUpdate: (data: { username: string }) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onProfileUpdate }) => {
  const [username, setUsername] = useState(user.user_metadata?.username || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null); // Use null for initial state
  const [error, setError] = useState<string | null>(null); // Use null for initial state

  // Common button style from HomePage/AuthPage
  const buttonClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400";
  // Input style for dark theme
  const inputClasses = "block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50";
  const inputIconClasses = "absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { username: username }
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Profil sikeresen frissítve');
      onProfileUpdate({ username });
    } catch (err: any) {
      setError(err.message || 'Hiba történt a profil frissítésekor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          // Dark theme error message style
          className="p-3 bg-red-900/30 border border-red-700 text-red-400 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          // Dark theme success message style
          className="p-3 bg-green-900/30 border border-green-700 text-green-400 rounded-lg text-sm"
        >
          {success}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1">
            Felhasználónév
          </label>
          <div className="relative">
            <div className={inputIconClasses}>
              <UserIcon size={16} />
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              // Apply dark input style, add pl-10 for icon
              className={`${inputClasses} pl-10`} 
              placeholder="Add meg a felhasználóneved"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="pt-2"> {/* Added padding top for separation */}
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Email cím
          </label>
          <input
            type="email"
            value={user.email || ''}
            readOnly
            // Apply dark input style, make background slightly different for read-only
            className={`${inputClasses} bg-zinc-800 cursor-not-allowed`} 
          />
          <p className="mt-1 text-xs text-zinc-400">
            Az email cím nem módosítható
          </p>
        </div>

        <motion.button
          type="submit"
          // Apply orange gradient button style
          className={`${buttonClasses} w-full flex items-center justify-center gap-2 mt-6`} // Added gap and margin-top
          disabled={loading}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
          ) : (<Save size={18} />)} 
          <span>{loading ? 'Mentés...' : 'Mentés'}</span>
        </motion.button>
      </form>
    </div>
  );
};

export default ProfileSettings;
