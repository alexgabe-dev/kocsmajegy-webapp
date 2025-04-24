import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Save, User as UserIcon } from 'lucide-react';

interface ProfileSettingsProps {
  user: User;
  onProfileUpdate: (data: { username: string }) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onProfileUpdate }) => {
  const [username, setUsername] = useState(user.user_metadata?.username || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Update user metadata
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
    <div className="bg-card dark:bg-black rounded-xl shadow-md overflow-hidden border border-border dark:border-gray-800">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Profil beállítások</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Felhasználónév
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon size={16} className="text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email cím
            </label>
            <input
              type="email"
              value={user.email || ''}
              readOnly
              className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-black/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Az email cím nem módosítható
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center justify-center space-x-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Feldolgozás...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Mentés</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
