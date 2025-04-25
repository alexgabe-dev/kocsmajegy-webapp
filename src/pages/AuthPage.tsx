"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Loader2, Lock, Mail, Eye, EyeOff, Beer, AlertTriangle, User } from "lucide-react"
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../lib/supabase';

import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); 
  const [isResetPassword, setIsResetPassword] = useState(false); 

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(''); 

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false); 

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });

        if (error) {
          setError(`Hiba a jelszó-visszaállítási email küldésekor: ${error.message}`);
        } else {
          setSuccess('Jelszó visszaállítási email elküldve. Kérjük, ellenőrizd a postaládádat.');
        }
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password,
        });

        if (error) throw error;
        navigate('/');
      } else {
        if (password !== confirmPassword) {
          throw new Error('A jelszavak nem egyeznek');
        }

        if (password.length < 6) {
          throw new Error('A jelszónak legalább 6 karakter hosszúnak kell lennie');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: username,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email,
              full_name: username,
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('Profil létrehozási hiba:', profileError);
          }
        }

        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsResetPassword(false);
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
    setIsLogin(true); 
  };

  const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsResetPassword(false); 
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  const handleForgotPasswordClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsResetPassword(true);
    setIsLogin(false); 
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  const formVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const formTransition = {
    duration: 0.3,
    ease: "easeInOut",
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-black p-4 overflow-hidden">
      {mounted && (
        <>
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-20"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(234, 88, 12, 0.15) 0%, transparent 60%)`,
            }}
          />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-10 top-1/4 h-64 w-64 rounded-full bg-orange-900/10 blur-3xl" />
            <div className="absolute -right-10 bottom-1/4 h-64 w-64 rounded-full bg-orange-900/10 blur-3xl" />
          </div>
        </>
      )}

      <div className="z-10 flex w-full max-w-5xl flex-col lg:flex-row lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 flex flex-col items-center justify-center p-6 lg:mb-0 lg:w-1/2 lg:items-start"
        >
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-orange-800">
            <Beer className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            KOCSMA<span className="text-orange-600">JEGY</span>
          </h1>
          <p className="mb-6 text-center text-sm text-zinc-400 sm:text-base lg:text-left">A legjobb kocsmák, egy helyen</p>

          <div className="mt-8 hidden space-y-6 lg:block">
             <div className="flex items-center space-x-4">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
               </div>
               <div>
                 <h3 className="font-medium text-white">Értékelések</h3>
                 <p className="text-sm text-zinc-500">Őszinte vélemények, valós személyektől</p>
               </div>
             </div>
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" viewBox="0 0 512 512" fill="currentColor">
  <path d="M108.36,428.924c0,11.214,9.114,20.353,20.336,20.353h139.598c11.214,0,20.344-9.139,20.344-20.353V270.59H108.36V428.924z" />
  <path d="M462.887,215.16c-16.103-16.21-38.589-26.046-63.06-25.948c-9.155-0.057-18.54,1.444-27.9,4.209c8.072-12.56,12.83-27.44,12.83-43.536c0-30.542-16.842-57.104-41.731-70.919C330.467,33.371,288.744,0,239.262,0c-18.721,0-36.293,4.815-51.558,13.174c-11.715-7.309-25.628-11.501-40.484-11.501c-37.022,0.107-67.981,25.94-75.627,60.664c-28.343,11.091-48.425,38.802-48.425,71.124c0,21.238,8.581,40.377,22.388,54.192v241.295c0,45.923,37.235,83.051,83.158,83.051h139.63c45.816,0,83.043-37.128,83.043-83.051v-35.874c3.987,0.418,7.958,0.623,12.034,0.623c26.366,0,53.659-7.851,76.776-23.946c11.509-7.958,21.968-18.097,30.122-30.336c8.261-12.24,14.225-26.67,17.047-42.674c0.944-5.858,1.468-11.616,1.468-17.367C488.834,254.281,479.113,231.468,462.887,215.16z M320.008,428.949c0,28.458-23.216,51.673-51.665,51.673h-139.63c-28.556,0-51.78-23.215-51.78-51.673V209.507h243.076V428.949z M344.495,178.129H91.994c-9.409-1.568-17.67-6.062-24.159-12.552c-8.261-8.261-13.29-19.458-13.29-32.116c0-21.338,14.857-39.221,34.734-44.036l10.976-2.609l0.943-11.304c1.887-23.732,21.756-42.46,46.021-42.46c11.402,0,21.658,4.076,29.705,10.877l9.204,7.744l9.836-6.801c12.338-8.581,27.088-13.495,43.298-13.495c37.03,0,67.891,26.464,74.79,61.403l1.673,8.163l7.531,3.232c17.785,7.645,30.123,25.208,30.123,45.709C353.379,160.451,350.139,170.073,344.495,178.129z M446.053,289.736c-1.674,10.139-5.34,18.72-10.459,26.349c-7.539,11.296-18.622,20.295-31.484,26.464c-12.864,6.169-27.399,9.418-40.69,9.311c-4.183,0-8.162-0.205-12.034-0.828v-98.54c4.503-4.078,8.901-7.424,13.191-10.246c12.855-8.163,24.676-11.198,35.25-11.198c13.495,0,24.996,5.126,33.355,13.601c8.483,8.474,13.815,20.295,13.815,34.725C446.997,282.73,446.677,286.176,446.053,289.736z" />
</svg>
                </div>
                <div>
                  <h3 className="font-medium text-white">Barátok</h3>
                  <p className="text-sm text-zinc-500">Találd meg, hol isznak a barátaid</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div>
                  <h3 className="font-medium text-white">Közösség</h3>
                  <p className="text-sm text-zinc-500">Légy tagja értékes közösségnek</p>
                </div>
              </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full lg:w-1/2"
        >
          <div className="overflow-hidden rounded-3xl bg-zinc-900 shadow-[0_0_60px_-15px_rgba(234,88,12,0.3)]">
            <div className="relative h-1.5">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isResetPassword ? 'reset' : isLogin ? 'login' : 'register'}
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={formTransition}
                className="p-6 sm:p-10"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white sm:text-2xl">
                    {isResetPassword ? 'Jelszó visszaállítása' : (isLogin ? 'Üdvözlünk újra!' : 'Hozd létre a fiókod')}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400 sm:text-base">
                    {isResetPassword ? 'Add meg az email címed a visszaállításhoz.' : (isLogin ? 'Jelentkezz be a fiókodba' : 'Csatlakozz a KocsmaJegy közösséghez')}
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg flex items-start"
                    >
                      <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 bg-green-900/30 border border-green-500/50 text-green-400 rounded-lg"
                    >
                      <p className="text-sm">{success}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">
                      Email cím
                    </Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                        <Mail className="h-5 w-5" />
                      </div>
                      <motion.div whileFocus={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-full">
                        <Input
                          id="email"
                          type="email" 
                          placeholder="te@pelda.hu"
                          required
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          className="w-full border-zinc-800 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500"
                          disabled={loading}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {!isLogin && !isResetPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-zinc-300">
                        Felhasználónév
                      </Label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                          <User className="h-5 w-5" />
                        </div>
                        <motion.div whileFocus={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-full">
                          <Input
                            id="username"
                            type="text"
                            placeholder="Válaszd ki a neved"
                            required
                            value={username}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                            className="w-full border-zinc-800 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500"
                            disabled={loading}
                          />
                        </motion.div>
                      </div>
                    </div>
                  )}

                  {!isResetPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-zinc-300">
                          Jelszó
                        </Label>
                        {isLogin && (
                          <a
                            href="#"
                            onClick={handleForgotPasswordClick}
                            className="text-sm text-orange-500 hover:text-orange-400"
                          >
                            Elfelejtetted?
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                          <Lock className="h-5 w-5" />
                        </div>
                        <motion.div whileFocus={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-full">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder='••••••••'
                            required
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            className="w-full border-zinc-800 bg-zinc-800/50 pl-10 pr-10 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500"
                            disabled={loading}
                          />
                        </motion.div>
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
                          aria-label={showPassword ? "Jelszó elrejtése" : "Jelszó mutatása"}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isLogin && !isResetPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-zinc-300">
                        Jelszó megerősítése
                      </Label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                          <Lock className="h-5 w-5" />
                        </div>
                        <motion.div whileFocus={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} className="w-full">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder='••••••••'
                            required
                            value={confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                            className="w-full border-zinc-800 bg-zinc-800/50 pl-10 pr-10 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500"
                            disabled={loading}
                          />
                        </motion.div>
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
                          aria-label={showConfirmPassword ? "Jelszó elrejtése" : "Jelszó mutatása"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="relative w-full overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 focus:ring-orange-500 disabled:opacity-70"
                    >
                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isResetPassword ? 'Küldés...' : (isLogin ? 'Bejelentkezés...' : 'Regisztráció...')}
                          </motion.div>
                        ) : (
                          <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center">
                            {isResetPassword ? 'Jelszó-visszaállítási link küldése' : (isLogin ? 'Bejelentkezés' : 'Regisztráció')}
                            {!isResetPassword && <ArrowRight className="ml-2 h-4 w-4" />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-zinc-400">
                      {isResetPassword ? (
                        <>
                          Vissza a{' '}
                          <button onClick={resetForm} className="font-medium text-orange-500 hover:text-orange-400">
                            bejelentkezéshez
                          </button>
                        </>
                      ) : isLogin ? (
                        <>
                          Még nincs fiókod?{' '}
                          <button onClick={toggleMode} className="font-medium text-orange-500 hover:text-orange-400">
                            Regisztrálj most
                          </button>
                        </>
                      ) : (
                        <>
                          Már van fiókod?{' '}
                          <button onClick={toggleMode} className="font-medium text-orange-500 hover:text-orange-400">
                            Jelentkezz be
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}