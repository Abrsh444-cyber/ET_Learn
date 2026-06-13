/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';
import { 
  Key, User, Landmark, GraduationCap, ArrowRight, Info, Eye, EyeOff, 
  Mail, Lock, LogIn, UserPlus, ArrowLeft, ShieldAlert, CheckCircle 
} from 'lucide-react';
import EthioLearnLogo from './EthioLearnLogo';
import StudentAvatarSelector from './StudentAvatarSelector';
import StudentAvatar from './StudentAvatar';

interface SplashOnboardingProps {
  onComplete: (profile: StudentProfile) => void;
  initialProfile?: StudentProfile | null;
}

interface AccountInfo {
  email: string;
  passwordEncrypted: string; // Plain password for prototype/localStorage authenticity
  rememberMe: boolean;
  profile: StudentProfile;
}

export default function SplashOnboarding({ onComplete, initialProfile }: SplashOnboardingProps) {
  // Mode switcher: 'splash' | 'signin' | 'signup'
  const [mode, setMode] = useState<'splash' | 'signin' | 'signup'>('splash');
  
  // Registration and Authentication inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [year, setYear] = useState('1st Year');
  const [avatar, setAvatar] = useState('star');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "Emerging Technologies", "Introduction to Economics", "General Biology", "Communicative English", "Moral and Civic Education"
  ]);
  const [claudeApiKey, setClaudeApiKey] = useState('');
  
  // Interface toggles
  const [showKey, setShowKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Accounts list from local state
  const [registeredAccounts, setRegisteredAccounts] = useState<AccountInfo[]>([]);

  // Generate dynamic, beautiful background stars to create a premium cinematic space
  const [starNodes] = useState(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.7 + 0.3,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
    }));
  });
  
  const subjectsList = [
    "Emerging Technologies",
    "Introduction to Economics",
    "General Biology",
    "Communicative English",
    "Moral and Civic Education"
  ];

  // Fetch accounts on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ethiolearn_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRegisteredAccounts(parsed);
          // If accounts exist, default directly to 'signin' instead of splash to simplify reentry
          if (parsed.length > 0) {
            setMode('signin');
          }
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setEmail(initialProfile.email || '');
      setUniversity(initialProfile.university);
      setYear(initialProfile.year);
      setSelectedSubjects(initialProfile.subjects);
      setClaudeApiKey(initialProfile.claudeApiKey);
      if (initialProfile.avatar) {
        setAvatar(initialProfile.avatar);
      }
    }
  }, [initialProfile]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailTrim = email.trim().toLowerCase();
    const passwordTrim = password.trim();

    if (!emailTrim || !passwordTrim) {
      setAuthError("Please fill out both email and password fields.");
      playFailureChime();
      return;
    }

    // Lookup credentials
    const found = registeredAccounts.find(
      acc => acc.email.toLowerCase() === emailTrim && acc.passwordEncrypted === passwordTrim
    );

    if (!found) {
      setAuthError("Incorrect password or email. Please check your credentials.");
      playFailureChime();
      return;
    }

    // Save rememberMe selection
    try {
      const updatedAccounts = registeredAccounts.map(acc => {
        if (acc.email.toLowerCase() === emailTrim) {
          return { ...acc, rememberMe };
        }
        return acc;
      });
      localStorage.setItem('ethiolearn_accounts', JSON.stringify(updatedAccounts));
      
      // Set active user session
      localStorage.setItem('ethiolearn_active_email', found.email);
    } catch (e) {}

    playSuccessChime();
    
    // Pass completed profile to parent to load user session
    onComplete(found.profile);
  };

  const handleQuickLogin = (acc: AccountInfo) => {
    setAuthError(null);
    playClickChime();

    if (acc.rememberMe) {
      // Direct session validation bypass if "Remember Me" is true
      try {
        localStorage.setItem('ethiolearn_active_email', acc.email);
      } catch (e) {}
      playSuccessChime();
      onComplete(acc.profile);
    } else {
      // Autofill email and prompt for password
      setEmail(acc.email);
      setPassword('');
      setAuthError("Please enter your security password to login.");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const nameTrim = name.trim();
    const emailTrim = email.trim().toLowerCase();
    const passwordTrim = password.trim();

    if (!nameTrim || !emailTrim || !passwordTrim) {
      setAuthError("Full Name, Email, and Password are required to enroll.");
      playFailureChime();
      return;
    }

    if (!emailTrim.endsWith('@gmail.com')) {
      setAuthError("For security and verification, you must register using a valid Gmail address (@gmail.com).");
      playFailureChime();
      return;
    }

    if (passwordTrim.length < 5) {
      setAuthError("For safety, password must be at least 6 characters long.");
      playFailureChime();
      return;
    }

    // Check pre-existing accounts
    const exists = registeredAccounts.some(acc => acc.email.toLowerCase() === emailTrim);
    if (exists) {
      setAuthError("An academic account with this email address already exists.");
      playFailureChime();
      return;
    }

    // Create student profile
    const profile: StudentProfile = {
      name: nameTrim,
      email: emailTrim,
      university: university.trim() || "Wolkite University",
      year,
      subjects: selectedSubjects,
      claudeApiKey: claudeApiKey.trim(),
      dailyGoalHours: 2,
      theme: 'dark',
      language: 'both',
      avatar
    };

    const newAccount: AccountInfo = {
      email: emailTrim,
      passwordEncrypted: passwordTrim,
      rememberMe: rememberMe,
      profile
    };

    // Save accounts storage
    const updated = [...registeredAccounts, newAccount];
    try {
      localStorage.setItem('ethiolearn_accounts', JSON.stringify(updated));
      localStorage.setItem('ethiolearn_active_email', emailTrim);
    } catch (e) {}

    playSuccessChime();
    onComplete(profile);
  };

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#070707] z-50 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-8 select-none relative">
      
      {/* Dynamic Cinematic Motion Graphics Background Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black">
        {/* Floating star nodes with drifting cinematic loops */}
        {starNodes.map((star) => (
          <motion.div
            key={star.id}
            initial={{ 
              x: `${star.left}%`, 
              y: `${star.top}%`, 
              opacity: 0,
              scale: 0.5 
            }}
            animate={{ 
              y: [`${star.top}%`, `${(star.top + 8) % 100}%`, `${star.top}%`],
              opacity: [star.opacity * 0.4, star.opacity, star.opacity * 0.4],
              scale: [0.8, 1.25, 0.8]
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: star.delay
            }}
            style={{
              position: 'absolute',
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.id % 3 === 0 ? '#C8962E' : star.id % 3 === 1 ? '#1D4ED8' : '#e4e4e7',
              borderRadius: '50%',
              boxShadow: star.size > 2 ? `0 0 8px 1px ${star.id % 3 === 0 ? '#C8962E' : '#FFECA7'}` : 'none'
            }}
          />
        ))}

        {/* Ambient Pulsing Aura Orbs */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 0.9, 1],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[380px] h-[380px] rounded-full bg-emerald-950/20 blur-[130px]"
        />
        <motion.div 
          animate={{
            scale: [1.1, 0.9, 1.15, 1.1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[425px] h-[425px] rounded-full bg-amber-950/20 blur-[140px]"
        />

        {/* Traditional Geometric Habesha Bands with modern neon-wireframe style */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#C8962E]/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        
        {/* Step SPLASH */}
        {mode === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-lg flex flex-col items-center relative z-10 w-full my-auto"
          >
            <div className="relative w-56 h-56 mb-8 flex items-center justify-center">
              
              {/* Outer Counter-Rotating Segmented Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 42, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-[#C8962E]/10"
              />
              {/* Inner Fast Drifting Compass Segment */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-dashed border-emerald-500/15"
              />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                className="absolute inset-2 flex items-start justify-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#C8962E] shadow-[0_0_10px_2px_#C8962E]" />
              </motion.div>
              
              <motion.div 
                animate={{
                  scale: [0.92, 1.08, 0.92],
                  opacity: [0.15, 0.3, 0.15]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-10 rounded-full bg-gradient-to-br from-[#C8962E] via-red-600 to-emerald-500 blur-2xl opacity-20"
              />

              <motion.div
                whileHover={{ scale: 1.08 }}
                className="relative z-10 p-4 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-md shadow-2xl"
              >
                <EthioLearnLogo size={120} showCardBackground={false} />
              </motion.div>
            </div>

            <div className="space-y-3 mb-10">
              <h1 className="font-serif text-4xl md:text-5xl font-black text-[#C8962E] tracking-normal" style={{ textShadow: "0 0 20px rgba(200, 150, 46, 0.22)" }}>
                ኢትዮ ለርን ፕሮ
              </h1>
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#F0EDE8] tracking-widest uppercase">
                EthioLearn Pro
              </h2>

              <div className="flex items-center justify-center gap-3 w-40 mx-auto py-1">
                <div className="h-[1px] bg-gradient-to-r from-transparent to-[#C8962E]/40 flex-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C8962E]" />
                <div className="h-[1px] bg-gradient-to-l from-transparent to-emerald-500/40 flex-1" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-400 tracking-[0.25em] uppercase">
                  ተማር • አድግ • ብልጽግና
                </p>
                <p className="text-[#8A8480] text-[11px] font-mono tracking-widest uppercase">
                  Learn. Grow. Prosper.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm justify-center">
              <button
                onClick={() => { playClickChime(); setMode('signup'); }}
                className="px-8 py-3.5 bg-gradient-to-r from-[#C8962E] to-amber-600 text-black font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Create Profile
              </button>
              <button
                onClick={() => { playClickChime(); setMode('signin'); }}
                className="px-8 py-3.5 bg-zinc-950 border border-zinc-800 text-zinc-300 font-extrabold text-xs tracking-wider uppercase rounded-xl cursor-pointer hover:border-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Student Log In
              </button>
            </div>
          </motion.div>
        )}

        {/* Step SIGN IN */}
        {mode === 'signin' && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-[#111111]/95 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-zinc-800 relative z-10 shadow-2xl space-y-6 my-auto"
          >
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-3">
                <EthioLearnLogo size={42} />
                <div>
                  <h3 className="font-serif text-base font-bold text-[#F0EDE8]">Student Campus Portal</h3>
                  <p className="text-[10px] text-zinc-500 tracking-wider">SECURE DEVICE GATEWAY</p>
                </div>
              </div>
              <button
                onClick={() => { playClickChime(); setMode('splash'); }}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            {/* Quick Login Section (if accounts are stored) */}
            {registeredAccounts.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-[#C8962E] font-mono tracking-widest uppercase block">
                  Quick Access Profiles
                </span>
                <div className="grid grid-cols-1 gap-2.5 max-h-36 overflow-y-auto pr-1">
                  {registeredAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleQuickLogin(acc)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:bg-zinc-900/60 hover:border-zinc-800 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full border border-amber-600/30 overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
                          <StudentAvatar avatar={acc.profile.avatar || 'star'} name={acc.profile.name} size={28} />
                        </div>
                        <div className="text-left">
                          <span className="font-serif text-xs font-semibold text-zinc-200 block group-hover:text-amber-500 transition-colors">
                            {acc.profile.name}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 block">
                            {acc.email}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 font-mono text-[9px]">
                        {acc.rememberMe ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> One-Click
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                            Needs Key
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Sign-In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Gmail Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. abebe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#090909] border border-zinc-800 focus:border-[#C8962E] rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 outline-none text-xs transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Password Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#090909] border border-zinc-800 focus:border-[#C8962E] rounded-lg pl-10 pr-10 py-2.5 text-zinc-100 outline-none text-xs transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me box */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-400">Remember session (One-click Login)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-[#1A7A3C] hover:opacity-95 text-[#0d0d0d] font-serif font-extrabold text-xs tracking-wider uppercase rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4 text-[#0d0d0d]" /> Enter Campus
              </button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-900/60">
              <p className="text-xs text-zinc-500">
                Don't have an academic account on this device?{' '}
                <button
                  onClick={() => { playClickChime(); setMode('signup'); }}
                  className="text-[#C8962E] font-bold hover:underline cursor-pointer"
                >
                  Register Profile
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* Step SIGN UP */}
        {mode === 'signup' && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-xl bg-[#111111]/95 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-zinc-800 relative z-10 shadow-2xl space-y-4 my-auto"
          >
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-3">
                <EthioLearnLogo size={36} />
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F0EDE8]">Academic Registration</h3>
                  <p className="text-[9px] text-zinc-500">SET UP COHORT MEMBERSHIP</p>
                </div>
              </div>
              <button
                onClick={() => { playClickChime(); setMode(registeredAccounts.length > 0 ? 'signin' : 'splash'); }}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Account Credentials Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Full Student Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Kebede"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#090909] border border-zinc-800 focus:border-[#C8962E] rounded-lg px-3 py-2 text-zinc-100 outline-none text-xs transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#090909] border border-zinc-800 focus:border-[#C8962E] rounded-lg px-3 py-2 text-zinc-100 outline-none text-xs transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    Academy Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 5 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#090909] border border-zinc-800 focus:border-[#C8962E] rounded-lg px-3 py-2 text-zinc-100 outline-none text-xs transition-all font-mono"
                  />
                </div>
              </div>

              {/* Choose Picture */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#C8962E] uppercase block">
                  Select Custom Portrait Avatar
                </label>
                <StudentAvatarSelector
                  currentAvatar={avatar}
                  name={name || 'Student'}
                  onChange={setAvatar}
                />
              </div>

              {/* School & Year Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                    University / High School
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wolkite University"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-[#090909] border border-zinc-800 focus:border-[#C8962E] rounded-lg px-3 py-2 text-zinc-100 outline-none text-xs transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Academic standing
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-[#090909] border border-zinc-800 focus:border-[#C8962E] rounded-lg px-3 py-2 text-zinc-100 outline-none text-xs transition-all appearance-none cursor-pointer"
                  >
                    <option value="1st Year">1st Year (Freshman)</option>
                    <option value="2nd Year">2nd Year (Sophomore)</option>
                    <option value="3rd Year">3rd Year (Junior)</option>
                    <option value="4th Year">4th Year (Senior)</option>
                    <option value="Secondary">Preparatory Secondary</option>
                  </select>
                </div>
              </div>

              {/* Enrolled Subjects */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Assign Campus Focus Modules (Select one or more)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {subjectsList.map((subject) => {
                    const selected = selectedSubjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
                          selected
                            ? 'bg-[#C8962E]/10 border-[#C8962E] text-[#C8962E]'
                            : 'bg-[#090909] border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {subject}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Custom LLM Model API Key (Optional)
                  </label>
                  <span className="text-[9px] text-[#C8962E] flex gap-1.5 shrink-0">
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="hover:underline">OpenRouter</a>
                    <span>|</span>
                    <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="hover:underline">Groq</a>
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="Optional. Press view key or leave blank to proxy built-in AI models."
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    className="w-full bg-[#050505] border border-zinc-900 focus:border-[#C8962E] rounded-lg pl-3 pr-10 py-1.5 text-zinc-200 outline-none text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#C8962E]"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-400">Remember session (One-click Login)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#C8962E] to-[#1A7A3C] text-black font-serif font-extrabold text-xs tracking-wider uppercase rounded-lg cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                Register & Enter Campus <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-900/60">
              <p className="text-xs text-zinc-500">
                Already registered on this browser?{' '}
                <button
                  onClick={() => { playClickChime(); setMode('signin'); }}
                  className="text-[#C8962E] font-bold hover:underline cursor-pointer"
                >
                  Student Login
                </button>
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
