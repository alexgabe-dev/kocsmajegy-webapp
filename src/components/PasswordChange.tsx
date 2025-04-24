import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

interface PasswordChangeProps {
  onUpdatePassword?: (data: { password: string }) => void;
}

const PasswordChange: React.FC<PasswordChangeProps> = () => {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validation
      if (newPassword !== confirmPassword) {
        showToast('Az új jelszó és a megerősítés nem egyezik', 'error');
        return;
      }

      if (newPassword.length < 6) {
        showToast('Az új jelszónak legalább 6 karakter hosszúnak kell lennie', 'error');
        return;
      }

      setLoading(true);

      // First verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        showToast('A jelenlegi jelszó helytelen', 'error');
        return;
      }

      // Check if new password is same as current password
      if (currentPassword === newPassword) {
        showToast('Az új jelszó nem egyezhet meg a jelenlegi jelszóval', 'error');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        if (updateError.message.includes('different from the old password')) {
          showToast('Az új jelszó nem egyezhet meg a jelenlegi jelszóval', 'error');
          return;
        }
        throw updateError;
      }

      // Success
      showToast('A jelszó sikeresen megváltozott', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Hiba történt a jelszó megváltoztatásakor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    showPassword, 
    onToggleShow 
  }: { 
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showPassword: boolean;
    onToggleShow: () => void;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock size={16} className="text-gray-400" />
        </div>
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          required
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          onClick={onToggleShow}
        >
          {showPassword ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          id="current-password"
          label="Jelenlegi jelszó"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          showPassword={showCurrentPassword}
          onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
        />

        <PasswordInput
          id="new-password"
          label="Új jelszó"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          showPassword={showNewPassword}
          onToggleShow={() => setShowNewPassword(!showNewPassword)}
        />

        <PasswordInput
          id="confirm-password"
          label="Új jelszó megerősítése"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showPassword={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className={`w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Folyamatban...</span>
            </>
          ) : (
            <>
              <Lock size={18} />
              <span>Jelszó megváltoztatása</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

export default PasswordChange;
