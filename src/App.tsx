import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { supabase } from './lib/supabase';
import HomePage from './pages/HomePage';
import RestaurantPage from './pages/RestaurantPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import AddRestaurantPage from './pages/AddRestaurantPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MobileNav from './components/MobileNav';
import './index.css';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kezdeti session lekérése
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Figyeljük az auth állapot változásait
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false); // Frissítjük a betöltési állapotot itt is
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Az üres dependency array itt helyes

  // Betöltési állapot kezelése
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ); // Vagy egy dedikált betöltő komponens
  }

  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <div className="min-h-screen bg-background text-foreground dark:bg-black pb-16 md:pb-0">
            <Routes>
              <Route
                path="/auth"
                element={!session ? <AuthPage /> : <Navigate to="/" replace />}
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />
              <Route
                path="/"
                element={session ? <HomePage /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/restaurant/:id"
                element={session ? <RestaurantPage /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/profile"
                element={session ? <ProfilePage /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/search"
                element={session ? <SearchPage /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/favorites"
                element={session ? <FavoritesPage /> : <Navigate to="/auth" replace />}
              />
              <Route
                path="/add"
                element={session ? <AddRestaurantPage /> : <Navigate to="/auth" replace />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {session && <MobileNav />}
          </div>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;