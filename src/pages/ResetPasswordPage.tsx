import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext'; // Feltételezve, hogy van ToastContext

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenFound, setTokenFound] = useState(false);

  // Ellenőrizzük, hogy a felhasználó a jelszó-visszaállítási folyamat részeként érkezett-e
  useEffect(() => {
    // Supabase automatikusan kezeli a tokent az URL fragmentumból (#)
    // és beállítja a sessiont, ha érvényes. Az onAuthStateChange ezt érzékeli.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenFound(true);
        // A session már tartalmazza a szükséges access_tokent
      } else if (!session) {
        // Ha nincs session és nem jelszóvisszaállítás, valami nincs rendben
        // vagy lejárt a token
        if (!tokenFound) { // Csak akkor navigáljunk, ha nem találtunk tokent az elején
            setError('Érvénytelen vagy lejárt jelszó-visszaállító link.');
            showToast('Érvénytelen vagy lejárt jelszó-visszaállító link.', 'error');
            // Optionally navigate away after a delay
             setTimeout(() => navigate('/auth'), 3000);
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!tokenFound) {
        setError('Jelszó-visszaállító token nem található vagy érvénytelen.');
        showToast('Jelszó-visszaállító token nem található vagy érvénytelen.', 'error');
        return;
    }

    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie.');
      showToast('A jelszónak legalább 6 karakter hosszúnak kell lennie.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      setError('A két jelszó nem egyezik.');
      showToast('A két jelszó nem egyezik.', 'error');
      return;
    }

    setLoading(true);
    try {
      // A Supabase kliens automatikusan használja a sessionben lévő access_tokent
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Jelszó sikeresen frissítve! Hamarosan átirányítunk a bejelentkezéshez.');
      showToast('Jelszó sikeresen frissítve!', 'success');
      setTimeout(() => {
        // Kijelentkeztetjük a felhasználót a jelszóvisszaállítási sessionből
        supabase.auth.signOut(); 
        navigate('/auth');
      }, 3000);

    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(`Hiba történt a jelszó frissítésekor: ${err.message}`);
      showToast(`Hiba történt a jelszó frissítésekor: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Új jelszó beállítása
        </h2>
        
        {!tokenFound && !error && (
            <p className="text-center text-yellow-600 dark:text-yellow-400">Jelszó-visszaállító token keresése...</p>
        )}

        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {tokenFound && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Új jelszó
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Új jelszó megerősítése
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Feldolgozás...</span>
                  </>
                ) : (
                  'Jelszó frissítése'
                )}
              </motion.button>
            </div>
          </form>
        )}
        
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
