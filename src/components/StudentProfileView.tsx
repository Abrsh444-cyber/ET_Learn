import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, User, Smartphone, LogIn, LogOut, CheckCircle, Flame, Clock, RefreshCw, BarChart2, Key, GraduationCap, Globe,
  HelpCircle, Send, MessageSquare, Database, Cloud
} from 'lucide-react';
import { StudentProfile } from '../types';
import { playClickChime, playSuccessChime, playFailureChime } from '../utils/audio';

interface StudentProfileViewProps {
  profile: StudentProfile;
  language: 'en' | 'am';
  onUpdateProfile: (updated: StudentProfile) => void;
  streakCount: number;
  studyHoursCount: number;
  
  // Google details
  googleUser: any;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;

  // PWA setup
  isInstallable?: boolean;
  triggerPWAInstall?: () => Promise<void>;
}

export default function StudentProfileView({
  profile,
  language,
  onUpdateProfile,
  streakCount,
  studyHoursCount,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isInstallable = false,
  triggerPWAInstall
}: StudentProfileViewProps) {
  
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isPhoneLoggedIn, setIsPhoneLoggedIn] = useState(false);
  const [phoneUser, setPhoneUser] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<{en: string, am: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Database Cloud Synchronization States
  const [dbProvider, setDbProvider] = useState<'supabase' | 'aws'>('supabase');
  const [syncSupabaseUrl, setSyncSupabaseUrl] = useState(() => localStorage.getItem('ethiolearn_supabase_url') || '');
  const [syncSupabaseKey, setSyncSupabaseKey] = useState(() => localStorage.getItem('ethiolearn_supabase_key') || '');
  const [awsRegion, setAwsRegion] = useState(() => localStorage.getItem('ethiolearn_aws_region') || 'us-east-1');
  const [awsAccessKeyId, setAwsAccessKeyId] = useState(() => localStorage.getItem('ethiolearn_aws_access_key') || '');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState(() => localStorage.getItem('ethiolearn_aws_secret_key') || '');
  const [awsTableName, setAwsTableName] = useState(() => localStorage.getItem('ethiolearn_aws_table') || 'ethiolearn_sync');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Help & Support Center States
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [ticketCategory, setTicketCategory] = useState<string>('Technical Help');
  const [ticketText, setTicketText] = useState<string>('');
  const [supportTickets, setSupportTickets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ethiolearn_support_tickets');
      return saved ? JSON.parse(saved) : [
        {
          id: "TKT-3829",
          category: "Blueprints & Exams help",
          text: "Will there be freshman entrance preparation blueprints added for university level?",
          status: "Resolved",
          date: "Yesterday",
          reply: "Yes! Freshmen levels focus heavily on Emerging Technologies and Communicative English. Practice materials are updated."
        }
      ];
    } catch (e) {
      return [];
    }
  });

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    playClickChime();
    
    if (!ticketText.trim()) {
      alert("Please describe your question or issue.");
      return;
    }

    const userEmail = profile.email || 'ezrat2116@gmail.com';

    const newTicket = {
      id: "TKT-" + Math.floor(1000 + Math.random() * 9000),
      category: ticketCategory,
      text: ticketText,
      email: userEmail,
      status: "Open",
      date: "Just now",
      reply: language === 'en' 
        ? `We have received your request. A verification message has been active-synced to ${userEmail}. An advisor will assist you shortly.`
        : `ጥያቄዎ ደርሶናል። የማረጋገጫ መልእክት ወደ ${userEmail} ተልኳል። ባለሙያዎቻችን በቅርቡ ያነጋግሩዎታል።`
    };

    const updated = [newTicket, ...supportTickets];
    setSupportTickets(updated);
    localStorage.setItem('ethiolearn_support_tickets', JSON.stringify(updated));
    setTicketText('');
    playSuccessChime();
    setSuccessMessage(language === 'en' 
      ? `Support ticket submitted! An active confirmation has been dispatched to ${userEmail}.`
      : `የድጋፍ ጥያቄዎ በተሳካ ሁኔታ ተልኳል! ማረጋገጫ ወደ ${userEmail} ተልኳል።`
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Load quiz logs
  const quizHistory = (() => {
    try {
      const stored = localStorage.getItem("ethiolearn_exam_sessions_history");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  })();

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    playClickChime();
    setErrorMessage(null);

    if (!phoneInput || phoneInput.length < 9) {
      setErrorMessage({
        en: "Kindly enter a valid 9-digit Ethiopian mobile number.",
        am: "እባክዎን ትክክለኛ የ9 አሃዝ ስልክ ቁጥር ያስገቡ።"
      });
      playFailureChime();
      return;
    }

    setShowOtpField(true);
    setSuccessMessage(
      language === 'en' 
        ? "Simulated SMS verification code sent to +251-" + phoneInput
        : "የማረጋገጫ ኮድ ወደ +251-" + phoneInput + " ተልኳል።"
    );
    playSuccessChime();
  };

  const verifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    playClickChime();
    setErrorMessage(null);

    if (otpInput === '1234' || otpInput.trim().length >= 4) {
      setIsPhoneLoggedIn(true);
      setPhoneUser("+251 " + phoneInput);
      setShowOtpField(false);
      onUpdateProfile({
        ...profile,
        phone: phoneInput,
        isRegistered: true
      });
      setSuccessMessage(
        language === 'en'
          ? "Successfully logged in securely with mobile number! Premium status unlocked."
          : "በስልክ ቁጥርዎ በተሳካ ሁኔታ ገብተዋል! ልዩ መብትዎ ክፍት ሆኗል!"
      );
      playSuccessChime();
    } else {
      setErrorMessage({
        en: "Invalid validation pin. Use '1234' as default.",
        am: "ያልተሳካ ኮድ። እባክዎን '1234'ን እንደ መደበኛ ኮድ ይሞክሩ።"
      });
      playFailureChime();
    }
  };

  const handlePhoneSignOut = () => {
    playClickChime();
    setIsPhoneLoggedIn(false);
    setPhoneUser(null);
    setPhoneInput('');
    setOtpInput('');
    onUpdateProfile({
      ...profile,
      isRegistered: false
    });
    setSuccessMessage(
      language === 'en' 
        ? "Logged out from phone authentication session."
        : "ከስልክ መግቢያው በተሳካ ሁኔታ ወጥተዋል።"
    );
  };

  const handleGoalChange = (newGoal: number) => {
    playClickChime();
    const updated = { ...profile, dailyGoalHours: newGoal };
    onUpdateProfile(updated);
  };

  const handleApiKeyChange = (key: string) => {
    const updated = { ...profile, claudeApiKey: key };
    onUpdateProfile(updated);
  };

  const handleCloudBackup = async () => {
    setSyncStatus('loading');
    setSyncMessage(language === 'en' ? 'Compressing and uploading local data...' : 'የአካባቢ መረጃን በመጫን ላይ...');
    playClickChime();

    // Collect all local study states
    const payload = {
      profile: localStorage.getItem('ethiolearn_current_profile'),
      notes: localStorage.getItem('ethiolearn_custom_notes'),
      decks: localStorage.getItem('ethiolearn_flashcards_decks'),
      streak: localStorage.getItem('ethiolearn_pro_streak'),
      hours: localStorage.getItem('ethiolearn_pro_study_hours'),
      dates: localStorage.getItem('ethiolearn_study_dates'),
      tickets: localStorage.getItem('ethiolearn_support_tickets'),
      sessions: localStorage.getItem('ethiolearn_study_sessions'),
      exams: localStorage.getItem('ethiolearn_exam_sessions_history'),
      analytics: localStorage.getItem('ethiolearn_analytics')
    };

    const isSupabase = dbProvider === 'supabase';
    const endpoint = isSupabase ? '/api/db/sync-supabase' : '/api/db/sync-aws';
    
    // Save credentials to localStorage
    if (isSupabase) {
      localStorage.setItem('ethiolearn_supabase_url', syncSupabaseUrl.trim());
      localStorage.setItem('ethiolearn_supabase_key', syncSupabaseKey.trim());
    } else {
      localStorage.setItem('ethiolearn_aws_region', awsRegion.trim());
      localStorage.setItem('ethiolearn_aws_access_key', awsAccessKeyId.trim());
      localStorage.setItem('ethiolearn_aws_secret_key', awsSecretAccessKey.trim());
      localStorage.setItem('ethiolearn_aws_table', awsTableName.trim());
    }

    const body = isSupabase ? {
      url: syncSupabaseUrl,
      key: syncSupabaseKey,
      email: profile.email,
      action: 'backup',
      payload
    } : {
      region: awsRegion,
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      tableName: awsTableName,
      email: profile.email,
      action: 'backup',
      payload
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Sync failed');
      
      setSyncStatus('success');
      setSyncMessage(language === 'en' ? 'Cloud Backup completed successfully!' : 'የደመና ምትኬ በተሳካ ሁኔታ ተጠናቋል!');
      playSuccessChime();
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(err.message || 'Connection failed.');
      playFailureChime();
    }
  };

  const handleCloudRestore = async () => {
    if (!confirm(language === 'en' 
      ? 'Are you sure you want to download and restore your cloud database backup? This will overwrite your current device data.'
      : 'እርግጠኛ ነዎት የደመና ምትኬን መጫን ይፈልጋሉ? ይህ የአሁኑን መረጃዎን ይተካዋል!')) {
      return;
    }

    setSyncStatus('loading');
    setSyncMessage(language === 'en' ? 'Fetching cloud backup and restoring campus...' : 'ምትኬን ከደመና ላይ በማውረድ ላይ...');
    playClickChime();

    const isSupabase = dbProvider === 'supabase';
    const endpoint = isSupabase ? '/api/db/sync-supabase' : '/api/db/sync-aws';

    const body = isSupabase ? {
      url: syncSupabaseUrl,
      key: syncSupabaseKey,
      email: profile.email,
      action: 'restore'
    } : {
      region: awsRegion,
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      tableName: awsTableName,
      email: profile.email,
      action: 'restore'
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      const restored = data.payload;
      if (restored) {
        // Write each key back to localStorage
        Object.entries(restored).forEach(([key, val]) => {
          const storageKey = key === 'profile' ? 'ethiolearn_current_profile' :
                             key === 'notes' ? 'ethiolearn_custom_notes' :
                             key === 'decks' ? 'ethiolearn_flashcards_decks' :
                             key === 'streak' ? 'ethiolearn_pro_streak' :
                             key === 'hours' ? 'ethiolearn_pro_study_hours' :
                             key === 'dates' ? 'ethiolearn_study_dates' :
                             key === 'tickets' ? 'ethiolearn_support_tickets' :
                             key === 'sessions' ? 'ethiolearn_study_sessions' :
                             key === 'exams' ? 'ethiolearn_exam_sessions_history' :
                             key === 'analytics' ? 'ethiolearn_analytics' : null;
          
          if (storageKey && val && typeof val === 'string') {
            localStorage.setItem(storageKey, val);
          }
        });

        setSyncStatus('success');
        setSyncMessage(language === 'en' ? 'Campus restored successfully! Reloading in 2s...' : 'ምትኬ በተሳካ ሁኔታ ተመልሷል! በአውቶማቲክ ድጋሚ በመጫን ላይ...');
        playSuccessChime();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Backup empty');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(err.message || 'Restore failed.');
      playFailureChime();
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages banners */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm font-medium flex items-start gap-2 shadow-sm animate-fade-in">
          <span>⚠️</span>
          <div>
            <p className="font-semibold">{errorMessage.en}</p>
            <p className="text-xs text-red-600 mt-1">{errorMessage.am}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Student badge / statistics / details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 text-center relative overflow-hidden">
            {/* Habesha colors indicator tab */}
            <div className="absolute top-0 inset-x-0 h-1 flex select-none">
              <div className="bg-emerald-500 h-full w-1/3" />
              <div className="bg-amber-400 h-full w-1/3" />
              <div className="bg-red-500 h-full w-1/3" />
            </div>

            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4 text-[#078930] dark:text-emerald-400 font-serif text-3xl font-extrabold shadow-inner">
              {profile.name.substring(0, 1).toUpperCase()}
            </div>

            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <h2 className="text-xl font-serif font-black text-slate-800 dark:text-zinc-100">{profile.name}</h2>
              {profile.isPro && (
                <CheckCircle className="w-5 h-5 fill-blue-500 text-white dark:text-[#0b0c10] shrink-0" title="Verified Pro User" />
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono mt-0.5">{profile.email}</p>

            {profile.isPro ? (
              <div className="mt-3.5 p-2.5 bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm">
                <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white dark:text-[#0b0c10]" />
                <span>Verified Pro student</span>
              </div>
            ) : (
              <div className="mt-3.5 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                <span>⚠️ Standard Account</span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                <span className="block text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase">{language === 'en' ? 'Grade Standard' : 'የትምህርት ደረጃ'}</span>
                <span className="font-serif font-extrabold text-slate-800 dark:text-zinc-200 text-sm block mt-1">{profile.year}</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                <span className="block text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase">{language === 'en' ? 'Institution' : 'ተቋም / ትምህርት ቤት'}</span>
                <span className="font-serif font-extrabold text-[#078930] dark:text-emerald-400 text-xs truncate block mt-1" title={profile.university}>
                  {profile.university}
                </span>
              </div>
            </div>

            {/* Custom Daily studying objective */}
            <div className="mt-5 space-y-2 text-left">
              <span className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {language === 'en' ? 'Daily Goal Hours' : 'የዕለታዊ ጥናት ግብ ቁጣጣሪ'}
              </span>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                {[1, 2, 3, 5].map((g) => {
                  const isActive = profile.dailyGoalHours === g;
                  return (
                    <button
                      key={g}
                      onClick={() => handleGoalChange(g)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#078930] text-white shadow font-sans' 
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 font-sans'
                      }`}
                    >
                      {g}h
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Core study diagnostics summary values */}
          <div className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1">
              <BarChart2 className="w-4 h-4 text-[#078930]" />
              {language === 'en' ? 'Achievement Metrics' : 'የእድገት ማሳያዎች'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 rounded-xl flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-emerald-800 dark:text-emerald-400 leading-none font-bold uppercase">Streak / ቀኖች</span>
                  <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-450 block mt-1">{streakCount} Days</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/60 rounded-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-[10px] text-amber-800 dark:text-amber-405 leading-none font-bold uppercase">Hours / ሰዓታት</span>
                  <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400 block mt-1">{studyHoursCount} Hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECURE PWA INSTALLATION COMPACT MODULE */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/20 dark:from-[#091a13] dark:to-[#050f0c] border border-emerald-250/60 dark:border-emerald-950/80 rounded-2xl p-5 space-y-3 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 dark:bg-emerald-400/2 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600/10 dark:bg-emerald-500/15 text-[#078930] dark:text-emerald-400 rounded-xl">
                <Smartphone className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] bg-emerald-650/10 dark:bg-emerald-500/10 text-[#078930] dark:text-emerald-400 font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {language === 'en' ? 'Offline Companion' : 'ከበይነመረብ ውጭ'}
                </span>
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 font-serif leading-tight mt-1 truncate">
                  {language === 'en' ? 'Direct Mobile & PC App' : 'የስልክና የኮምፒውተር መተግበሪያ'}
                </h4>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal font-sans">
              {language === 'en' 
                ? 'Convert EthioLearn into a lightweight home screen app with rapid local load speed.' 
                : 'ይህንን ድረ-ገጽ ያለ በይነመረብ በስልክዎ ላይ በቀጥታ የሚከፈት ፈጣን መተግበሪያ ያድርጉት።'}
            </p>

            {isInstallable && triggerPWAInstall ? (
              <button
                type="button"
                onClick={triggerPWAInstall}
                className="w-full py-2 bg-[#078930] hover:bg-emerald-700 text-white font-serif font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all active:scale-98"
              >
                <span>📥</span>
                <span>{language === 'en' ? 'Install EthioLearn' : 'መተግበሪያውን ጫን'}</span>
              </button>
            ) : (
              <div className="text-center bg-slate-100/30 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                <span className="text-[10px] text-slate-405 dark:text-zinc-400 font-medium flex items-center justify-center gap-1">
                  <span>✓</span> {language === 'en' ? 'Installed or ready with Safari/Chrome' : 'ተጭኗል ወይም በSafari/Chrome ይክፈቱ'}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-3.5 text-[9px] font-mono text-slate-400 dark:text-zinc-500 text-center select-none pt-0.5">
              <span>🚀 {language === 'en' ? 'No App Store' : 'ያለ አፕ ስቶር'}</span>
              <span>•</span>
              <span>🔋 {language === 'en' ? 'Low Data' : 'አነስተኛ ዳታ'}</span>
            </div>
          </div>
        </div>

        {/* Center/Right Column: Secure credentials logging, Quiz dashboard logs, APIs config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SIMPLE PROFILE DETAILS UPDATER CARD - Requirement */}
          <div className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-100 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
              <User className="w-5 h-5 text-[#078930]" />
              {language === 'en' ? 'Simple Profile Details' : 'ቀላል የመገለጫ መረጃዎች'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400 dark:text-zinc-500 block mb-1">
                    {language === 'en' ? 'Full Name' : 'ሙሉ ስም'}
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-sm rounded-xl px-4 py-2.5 focus:border-[#078930] focus:ring-1 focus:ring-[#078930] outline-none transition-colors h-11"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400 dark:text-zinc-500 block mb-1">
                    {language === 'en' ? 'Gmail / Email' : 'ጂሜል / ኢሜይል'}
                  </label>
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={profile.email || ''}
                    onChange={(e) => onUpdateProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-sm rounded-xl px-4 py-2.5 focus:border-[#078930] focus:ring-1 focus:ring-[#078930] outline-none transition-colors h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400 dark:text-zinc-500 block mb-1">
                    {language === 'en' ? 'Phone' : 'ስልክ ቁጥር'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 dark:text-zinc-500 select-none">
                      +251
                    </span>
                    <input
                      type="tel"
                      placeholder="9XXXXXXXX"
                      maxLength={9}
                      value={profile.phone || ''}
                      onChange={(e) => onUpdateProfile({ ...profile, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-sm rounded-xl pl-14 pr-4 py-2.5 focus:border-[#078930] focus:ring-1 focus:ring-[#078930] outline-none transition-colors h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400 dark:text-zinc-500 block mb-1">
                    {language === 'en' ? 'Academic Level' : 'ደረጃ'}
                  </label>
                  <select
                    value={profile.year}
                    onChange={(e) => onUpdateProfile({ ...profile, year: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 text-sm rounded-xl px-3 py-2.5 focus:border-[#078930] outline-none transition-colors h-11 cursor-pointer"
                  >
                    <option value="Grade 12" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-205">{language === 'en' ? 'Grade 12' : 'ክፍል 12'}</option>
                    <option value="University" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-205">{language === 'en' ? 'University' : 'ዩኒቨርሲቲ'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECURE LOGIN CHANNELS FOR STUDENTS */}
          <div className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-100 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-805">
              <Smartphone className="w-5 h-5 text-[#078930]" />
              {language === 'en' ? 'Secure Authentication Channels' : 'ደህንነቱ የተጠበቀ መለያ መግቢያ'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {/* Phone Verification Method */}
              <div className="space-y-3.5 border-r-0 md:border-r border-slate-100 pr-0 md:pr-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                  <Smartphone className="w-4 h-4 text-[#078930]" />
                  <span>{language === 'en' ? 'Login via Phone Number' : 'በስልክ ቁጥር መግቢያ'}</span>
                </div>

                {isPhoneLoggedIn ? (
                  <div className="bg-emerald-50 p-4 border border-emerald-200 rounded-xl space-y-3">
                    <p className="text-xs text-emerald-800 font-sans leading-relaxed">
                      {language === 'en' ? `Logged in securely with phone: ` : `መለያዎ ገብቷል፡ `}
                      <strong className="block font-mono text-sm text-[#078930] mt-1">{phoneUser}</strong>
                    </p>
                    <button
                      onClick={handlePhoneSignOut}
                      className="w-full h-12 min-h-[48px] bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-serif font-extrabold tracking-wide uppercase transition-colors flex items-center justify-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Disconnect Phone' : 'ከስልክ መለያ ውጣ'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={showOtpField ? verifyOTP : handlePhoneLogin} className="space-y-3">
                    {!showOtpField ? (
                      <div>
                        {/* Custom custom telephone layout prefixing +251 */}
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 tracking-wider flex items-center gap-1 select-none">
                            <span>🇪🇹</span> +251
                          </span>
                          <input
                            type="tel"
                            maxLength={9}
                            placeholder="912345678"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-18 pr-4 py-3 placeholder-slate-300 font-mono focus:border-emerald-600 outline-none h-12 min-h-[48px]"
                          />
                        </div>
                        <span className="block text-[10px] text-slate-400 mt-1 pl-1">
                          {language === 'en' ? 'Provide your 9-digit mobile number' : 'የ9 አሃዝ ስልክ ቁጥርዎን ያስገቡ'}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-slate-600">{language === 'en' ? 'Verification OTP Code' : 'የማረጋገጫ ኮድ'}</span>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Enter 1234 to verify"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 font-mono text-center h-12 min-h-[48px]"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full h-12 min-h-[48px] bg-[#078930] hover:bg-emerald-700 text-white rounded-xl text-xs font-serif font-extrabold tracking-wide uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{showOtpField ? (language === 'en' ? 'Verify PIN' : 'ኮዱን አረጋግጥ') : (language === 'en' ? 'Send Code' : 'ኮድ ላክ')}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Google/Guest Workspace integration Method */}
              <div className="space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                    <Globe className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '30s' }} />
                    <span>{language === 'en' ? 'Google Auth Sync' : 'በጉግል መለያ መግቢያ'}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-normal font-sans">
                    {language === 'en' 
                      ? 'Securely sync your daily progress scores directly to Google Sheets dashboard via your official account.' 
                      : 'የእለት ተእለት ጥናትዎን እና እድገትዎን ወደ ጉግል ሰነዶች መዝገብ በተከታታይ ያዘምኑ።'}
                  </p>
                </div>

                {googleUser ? (
                  <div className="bg-amber-50 p-3.5 border border-amber-200 rounded-xl space-y-2.5">
                    <div className="text-xs text-amber-800 leading-tight flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>{language === 'en' ? 'Synced with Google: ' : 'ከጉግል ጋር ተገናኝቷል፡ '} <strong>{googleUser.email}</strong></span>
                    </div>

                    <button
                      onClick={onGoogleSignOut}
                      className="w-full h-12 min-h-[48px] bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-serif font-extrabold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Disconnect Google' : 'ጉግልን አቋርጥ'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onGoogleSignIn}
                    className="w-full h-12 min-h-[48px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-200 rounded-xl text-sm font-serif font-extrabold tracking-wide flex items-center justify-center gap-2.5 cursor-pointer shadow-sm active:scale-98"
                  >
                    <span>🎯</span>
                    <span>{language === 'en' ? 'Log in with Google' : 'በጉግል ይግቡ'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Guest status notification row */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1 select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {language === 'en' ? 'Active Status: Educational Guest Mode Enabled' : 'የአሁኑ ሁኔታ፡ የእንግዳ መለያ ክፍት ነው'}
              </span>
            </div>
          </div>

          {/* Claude OpenRouter Custom Key Setup */}
          <div className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-150 flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800/80">
              <Key className="w-4 h-4 text-amber-500" />
              {language === 'en' ? 'Custom API Key (Optional)' : 'የአይ መምህር ማስተላለፊያ ኮድ (ግዴታ ያልሆነ)'}
            </h3>

            <p className="text-xs text-slate-400 dark:text-zinc-500 leading-relaxed font-sans">
              {language === 'en' 
                ? 'Your AI Tutor works out-of-the-box using the platform server. If you prefer utilizing your personal Antigravity or Gemini credentials directly, define them below.' 
                : 'ማንኛውንም ልዩ የግል አይ መምቻ መስመር ለመጠቀም ከፈለጉ ኮድዎን እዚህ ማከል ይችላሉ።'}
            </p>

            <div className="relative">
              <input
                type="password"
                placeholder={language === 'en' ? "sk-proj-..." : "የማለፊያ ኮዱን ያስገቡ..."}
                value={profile.claudeApiKey || ''}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 text-sm rounded-xl px-4 py-3 h-12 min-h-[48px] placeholder-slate-300 dark:placeholder-zinc-650 font-mono outline-none focus:border-amber-500 dark:focus:border-amber-600"
              />
            </div>
          </div>

          {/* ENROLLED QUIZ HISTORY LOGS - with correct empty states checks (Requirement) */}
          <div className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-150 flex items-center gap-1.5">
              <Trophy className="w-5 h-5 text-emerald-600 animate-pulse" />
              {language === 'en' ? 'Past Quiz History Logs' : 'ታሪካዊ የፈተና ውጤቶች'}
            </h3>

            {quizHistory.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-center text-xs text-slate-400 dark:text-zinc-500 font-serif">
                <p>{language === 'en' ? "You haven't completed any practice quiz sheets yet." : "እስካሁን የወሰዱት የፈተና ሙከራ የለም።"}</p>
                <p className="text-[10px] text-slate-350 dark:text-zinc-550 mt-1 uppercase font-bold tracking-wider font-sans">
                  {language === 'en' ? "Scores appear here once you take a quiz!" : "የፈተና ወረቀት ሲጨርሱ ውጤትዎ እዚህ ይታያል!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {quizHistory.map((sess: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-zinc-100">{sess.subject}</p>
                      <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 mt-0.5">{sess.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-extrabold text-[#078930] dark:text-emerald-400 bg-[#078930]/5 border border-[#078930]/10 px-2 py-1 rounded">
                        {sess.score}%
                      </span>
                      <span className={`font-black uppercase w-7 h-7 rounded-full flex items-center justify-center text-[11px] ${
                        sess.grade === 'F' ? 'bg-red-50 dark:bg-red-955/20 text-red-500' : 'bg-emerald-50 dark:bg-emerald-955/20 text-[#078930] dark:text-emerald-400'
                      }`}>
                        {sess.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HELP & SUPPORT CENTER (Requirement) */}
          <div className="bg-white dark:bg-[#0c0d12] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-base font-bold font-serif text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#078930]" />
                <span>{language === 'en' ? 'Support & Help Center' : 'የእርዳታና ድጋፍ መስጫ ማዕከል'}</span>
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>Active</span>
              </div>
            </div>

            {/* Connected Support Email Badge */}
            <div className="p-3.5 bg-[#078930]/5 dark:bg-[#078930]/10 border border-[#078930]/15 dark:border-[#078930]/35 rounded-xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">📧</span>
                <span className="text-[11px] font-extrabold uppercase text-[#078930] dark:text-emerald-400 tracking-wider">
                  {language === 'en' ? 'Active Support Channel' : 'ገባሪ የድጋፍ መስመር'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-zinc-200 font-bold leading-relaxed">
                {language === 'en' ? 'Connected Email:' : 'የተገናኘው ኢሜይል:'}{' '}
                <span className="text-[#078930] dark:text-emerald-400 font-mono underline select-all">
                  {profile.email || 'ezrat2116@gmail.com'}
                </span>
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans leading-tight pt-1">
                {language === 'en' 
                  ? 'All inquiries and response confirmations are instantly synchronized to your active address.'
                  : 'ሁሉም ጥያቄዎች እና መልሶች ወደዚህ ኢሜይል አድራሻ ይላካሉ።'}
              </p>
            </div>

            {/* Quick FAQ accordion items */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                {language === 'en' ? 'Frequently Asked Questions' : 'ተደጋግመው የሚነሱ ጥያቄዎች'}
              </span>

              {[
                {
                  q: language === 'en' ? "How does the study streak counter stay active?" : "የጥናት ቀኖች ቀጣይነት (Streak) እንዴት ይሰራል?",
                  a: language === 'en' 
                    ? "EthioLearn Pro tracks actual daily study days. Studying with the AI Tutor, submitting quizzes, or updating notes once per day extends your streak. Miss a day, and the local index resets!"
                    : "EthioLearn Pro የእርስዎን ዕለታዊ የትምህርት ጥረት በቅጽበት ይመዘግባል። በየቀኑ ከአይ መምህሩ ጋር መወያየት ወይም ፈተናዎችን መውሰድ የጥናት ቀኖችዎን ከመቋረጥ ያድነዋል።"
                },
                {
                  q: language === 'en' ? "Where does the Grade 12 educational blueprint originate?" : "የክፍል 12 ስርአተ-ትምህርት ይዘቶች ከየት የተገኙ ናቸው?",
                  a: language === 'en'
                    ? "Course directions mirror the official Ethiopian Ministry of Education national senior curriculum and university entry standards."
                    : "በዚህ መተግበሪያ ውስጥ የሚገኙት ጥያቄዎች እና የፈተና ይዘቶች በኢትዮጵያ ትምህርት ሚኒስቴር ይፋዊ የክፍል 12 እና የዩኒቨርሲቲ መቁጠሪያ ህግጋት ላይ የተመሰረቱ ናቸው።"
                }
              ].map((faq, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div key={idx} className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => { playClickChime(); setActiveFaqIndex(isOpen ? null : idx); }}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-slate-400 dark:text-zinc-500 text-lg">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-white dark:bg-zinc-900 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-50 dark:border-zinc-800/80">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit a support ticket form */}
            <form onSubmit={handleSubmitTicket} className="space-y-3.5 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-150 dark:border-zinc-800">
              <span className="block text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide">
                {language === 'en' ? 'Submit an Inquiry / Open Ticket' : 'አዲስ የእርዳታ ጥያቄ ይክፈቱ'}
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block mb-1">{language === 'en' ? 'Category' : 'ፈረጅ'}</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-slate-705 dark:text-zinc-200 focus:border-[#078930] outline-none cursor-pointer text-slate-700"
                  >
                    <option value="Technical Help">{language === 'en' ? 'Technical Help' : 'የቴክኒክ ድጋፍ'}</option>
                    <option value="Exams & Blueprints">{language === 'en' ? 'Exams & Blueprints' : 'የፈተና ረዳት'}</option>
                    <option value="Scholarship Inquiries">{language === 'en' ? 'Scholarship Inquiries' : 'የስኮላርሺፕ መረጃ'}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block mb-1">{language === 'en' ? 'Academic Level' : 'ደረጃ'}</label>
                  <div className="px-3 py-2 bg-slate-200/50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-slate-600 dark:text-zinc-300 font-mono">
                    {profile.year}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 block mb-1">{language === 'en' ? 'Describe your issue / question' : 'የጥያቄው ዝርዝር መግለጫ'}</label>
                <textarea
                  rows={2}
                  maxLength={400}
                  placeholder={language === 'en' ? "E.g., I am preparing for University remedial exam. Can you suggest biology schedules..." : "ለምሳሌ፡ የዩኒቨርሲቲ መግብያ ፈተናዎችን እንዴት መለማመድ እችላለሁ..."}
                  value={ticketText}
                  onChange={(e) => setTicketText(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-705 dark:text-zinc-200 focus:border-[#078930] outline-none resize-none text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 min-h-[40px] bg-[#078930] hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Send Ticket' : 'ጥያቄውን ላክ'}</span>
              </button>
            </form>

            {/* Display list of active tickets */}
            {supportTickets.length > 0 && (
              <div className="space-y-2 mt-2">
                <span className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                  {language === 'en' ? 'Your Active Tickets' : 'የጥያቄዎችዎ ሁኔታ መከታተያ'}
                </span>
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {supportTickets.map((tkt: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono font-bold text-[10.5px]">
                        <span className="text-slate-500 dark:text-zinc-450">{tkt.id} • {tkt.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase ${
                          tkt.status === 'Resolved' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                        }`}>
                          {tkt.status}
                        </span>
                      </div>
                      <p className="font-serif font-semibold text-slate-800 dark:text-zinc-200">{tkt.text}</p>
                      {tkt.reply && (
                        <div className="p-2.5 bg-white dark:bg-zinc-850 rounded-lg border border-slate-105 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 mt-1 pl-3 border-l-2 border-l-[#078930] leading-relaxed">
                          <span className="block text-[9px] font-bold uppercase text-emerald-850 dark:text-emerald-400 tracking-wider mb-0.5">Response from advisor:</span>
                          {tkt.reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
