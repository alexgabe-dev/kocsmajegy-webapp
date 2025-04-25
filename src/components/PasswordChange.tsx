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

  const buttonClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400";
  const inputClasses = "block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50";
  const inputIconClasses = "absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400";

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
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className={inputIconClasses}>
          <Lock size={16} />
        </div>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`${inputClasses} pl-10 pr-10`}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
          aria-label={showPassword ? "Jelszó elrejtése" : "Jelszó megjelenítése"} 
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff size={16} className="text-zinc-400 hover:text-zinc-300" />
          ) : (
            <Eye size={16} className="text-zinc-400 hover:text-zinc-300" />
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
          className={`${buttonClasses} w-full flex items-center justify-center gap-2 mt-6`}
          disabled={loading}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
          ) : null} 
          <span>{loading ? 'Mentés...' : 'Jelszó mentése'}</span>
        </motion.button>
      </form>
    </div>
  );
};

export default PasswordChange;
